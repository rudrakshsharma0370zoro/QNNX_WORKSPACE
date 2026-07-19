import { getGoogleAccessToken, GoogleScopes } from './googleServiceAuth';

/**
 * ============================================================================
 * Enterprise Edge-Compatible Firestore Admin Subsystem (REST API)
 * ============================================================================
 *
 * Hosting on Cloudflare Pages means all API routes execute in the Edge Runtime,
 * where the Node-only `firebase-admin` SDK cannot run. Client-side Firestore is
 * locked down (`write: false`), so server writes go through the Firestore REST
 * API authenticated as the service account.
 *
 * The OAuth2 access token (and its caching) is provided by
 * `./googleServiceAuth`, so this module focuses purely on document I/O.
 */

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';

function requireProjectId(): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      'Configuration Missing: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.'
    );
  }
  return projectId;
}

function documentsUrl(path: string): string {
  return `${FIRESTORE_BASE}/projects/${requireProjectId()}/databases/(default)/documents/${path}`;
}

/**
 * Maps JS values to Google Firestore REST API field-value formats.
 * Integers are encoded as `integerValue` (not `doubleValue`) so counters and
 * ids round-trip cleanly.
 */
function convertToFirestoreValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val };
  }
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(convertToFirestoreValue) } };
  }
  if (typeof val === 'object') {
    return { mapValue: { fields: toFields(val as Record<string, unknown>) } };
  }
  return { stringValue: String(val) };
}

/** Convert a plain object into a Firestore REST `fields` map (skips undefined). */
function toFields(data: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields[key] = convertToFirestoreValue(value);
    }
  }
  return fields;
}

/**
 * Creates a document in a collection with admin bypass.
 *
 * @param collection - Name of the collection (e.g., 'tasks')
 * @param data - The fields to populate in the new document
 * @param documentId - Optional explicit document ID (e.g. a user's uid);
 *                     omitted, Firestore auto-generates one
 * @returns The created document ID
 */
export async function firestoreAdminCreate(
  collection: string,
  data: Record<string, unknown>,
  documentId?: string
): Promise<string> {
  const token = await getGoogleAccessToken(GoogleScopes.DATASTORE);

  const url = documentId
    ? `${documentsUrl(collection)}?documentId=${encodeURIComponent(documentId)}`
    : documentsUrl(collection);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: toFields(data) }),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error?.message || 'Firestore REST create failed.');
  }

  // name: projects/{project}/databases/(default)/documents/{collection}/{id}
  const parts: string[] = resData.name.split('/');
  return parts[parts.length - 1];
}

/**
 * Updates specific fields of an existing document with admin bypass.
 * Uses the `currentDocument.exists=true` precondition so a patch on a missing
 * document fails with 404 instead of silently creating it.
 *
 * @param collection - Name of the collection
 * @param documentId - The ID of the target document
 * @param data - Key-value pairs of fields to update
 */
export async function firestoreAdminUpdate(
  collection: string,
  documentId: string,
  data: Record<string, unknown>
): Promise<void> {
  const token = await getGoogleAccessToken(GoogleScopes.DATASTORE);

  const params = new URLSearchParams();
  params.append('currentDocument.exists', 'true');
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      params.append('updateMask.fieldPaths', key);
    }
  }

  const response = await fetch(
    `${documentsUrl(`${collection}/${documentId}`)}?${params.toString()}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: toFields(data) }),
    }
  );

  const resData = await response.json();
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `NOT_FOUND: Document '${documentId}' in collection '${collection}' does not exist.`
      );
    }
    throw new Error(resData.error?.message || 'Firestore REST update failed.');
  }
}

/**
 * Upsert: merges fields into a document, creating it when it does not exist.
 *
 * Identical to `firestoreAdminUpdate` except that it omits the
 * `currentDocument.exists=true` precondition, so the first write succeeds
 * instead of throwing NOT_FOUND. Use this where the document is created lazily
 * on first write — e.g. the private profile doc at
 * `users/{uid}/private/details`, which does not exist until a user first saves
 * their personal information.
 *
 * `path` is a full document path relative to the database root, so
 * subcollections are supported: `users/abc123/private`.
 *
 * @param path - Collection path (may be nested, e.g. 'users/{uid}/private')
 * @param documentId - The ID of the target document
 * @param data - Key-value pairs of fields to merge
 */
export async function firestoreAdminSet(
  path: string,
  documentId: string,
  data: Record<string, unknown>
): Promise<void> {
  const token = await getGoogleAccessToken(GoogleScopes.DATASTORE);

  // Only the listed fields are touched; any field omitted here is preserved.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      params.append('updateMask.fieldPaths', key);
    }
  }

  const response = await fetch(
    `${documentsUrl(`${path}/${documentId}`)}?${params.toString()}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: toFields(data) }),
    }
  );

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error?.message || 'Firestore REST upsert failed.');
  }
}

// ---------------------------------------------------------------------------
// Reading (Firestore REST value -> JS)
// ---------------------------------------------------------------------------

function fromFirestoreValue(value: Record<string, unknown>): unknown {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    const arr = (value.arrayValue as { values?: Record<string, unknown>[] }).values ?? [];
    return arr.map(fromFirestoreValue);
  }
  if ('mapValue' in value) {
    const fields =
      (value.mapValue as { fields?: Record<string, Record<string, unknown>> }).fields ?? {};
    return fromFirestoreFields(fields);
  }
  return null;
}

function fromFirestoreFields(
  fields: Record<string, Record<string, unknown>>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    out[key] = fromFirestoreValue(val);
  }
  return out;
}

/**
 * Fetches a single document and returns its decoded fields, or null if it does
 * not exist. Used for server-side checks (e.g. task ownership).
 */
export async function firestoreAdminGet(
  collection: string,
  documentId: string
): Promise<Record<string, unknown> | null> {
  const token = await getGoogleAccessToken(GoogleScopes.DATASTORE);

  const response = await fetch(documentsUrl(`${collection}/${documentId}`), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) return null;

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error?.message || 'Firestore REST get failed.');
  }

  return fromFirestoreFields(
    (resData.fields as Record<string, Record<string, unknown>>) ?? {}
  );
}

/**
 * Atomically updates a document with admin bypass, supporting both literal
 * field writes (`set`) and array-union appends (`appendUnique`, the REST
 * equivalent of the client SDK's `arrayUnion`). Uses the Firestore `:commit`
 * endpoint so field updates and array transforms apply in a single write.
 * Requires the document to already exist (throws `NOT_FOUND` otherwise).
 */
export async function firestoreAdminCommit(
  collection: string,
  documentId: string,
  ops: { set?: Record<string, unknown>; appendUnique?: Record<string, unknown[]> }
): Promise<void> {
  const token = await getGoogleAccessToken(GoogleScopes.DATASTORE);
  const projectId = requireProjectId();
  const name = `projects/${projectId}/databases/(default)/documents/${collection}/${documentId}`;

  const setKeys = ops.set
    ? Object.keys(ops.set).filter((k) => ops.set![k] !== undefined)
    : [];

  const write: Record<string, unknown> = {
    update: { name, fields: ops.set ? toFields(ops.set) : {} },
    updateMask: { fieldPaths: setKeys },
    currentDocument: { exists: true },
  };

  if (ops.appendUnique) {
    const updateTransforms = Object.entries(ops.appendUnique)
      .filter(([, values]) => values.length > 0)
      .map(([fieldPath, values]) => ({
        fieldPath,
        appendMissingElements: { values: values.map(convertToFirestoreValue) },
      }));
    if (updateTransforms.length > 0) {
      write.updateTransforms = updateTransforms;
    }
  }

  const response = await fetch(
    `${FIRESTORE_BASE}/projects/${projectId}/databases/(default)/documents:commit`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ writes: [write] }),
    }
  );

  const resData = await response.json();
  if (!response.ok) {
    const apiStatus: string = resData.error?.status || '';
    const message: string = resData.error?.message || '';
    if (
      response.status === 404 ||
      apiStatus === 'NOT_FOUND' ||
      apiStatus === 'FAILED_PRECONDITION' ||
      /no (entity|document)/i.test(message)
    ) {
      throw new Error(
        `NOT_FOUND: Document '${documentId}' in collection '${collection}' does not exist.`
      );
    }
    throw new Error(message || 'Firestore REST commit failed.');
  }
}

/**
 * Deletes a document with admin bypass. A missing document (404) is treated as
 * success (idempotent delete).
 */
export async function firestoreAdminDelete(
  collection: string,
  documentId: string
): Promise<void> {
  const token = await getGoogleAccessToken(GoogleScopes.DATASTORE);

  const response = await fetch(documentsUrl(`${collection}/${documentId}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok && response.status !== 404) {
    const resData = await response.json().catch(() => ({}));
    throw new Error(resData.error?.message || 'Firestore REST delete failed.');
  }
}

/**
 * Fetches all documents in a collection.
 */
export async function firestoreAdminList(
  collection: string
): Promise<Record<string, unknown>[]> {
  const token = await getGoogleAccessToken(GoogleScopes.DATASTORE);

  const response = await fetch(documentsUrl(collection), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) return [];

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error?.message || 'Firestore REST list failed.');
  }

  const documents = resData.documents || [];
  return documents.map((doc: any) => {
    const parts = doc.name.split('/');
    const id = parts[parts.length - 1];
    return {
      id,
      ...fromFirestoreFields(doc.fields || {}),
    };
  });
}
