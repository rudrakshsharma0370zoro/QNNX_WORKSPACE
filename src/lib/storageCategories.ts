import type { AppRole } from './firebaseAuthAdmin';

/**
 * ============================================================================
 * Storage Categories, Tiers & Role-Based Access Policy
 * ============================================================================
 *
 * Files in S3 are organized under category "directories" (key prefixes). S3 has
 * no real folders — a prefix comes into existence when the first object with
 * that prefix is uploaded. Access control is enforced here in code.
 *
 * Key layout:  {category}/{ownerUid}/{timestamp}-{sanitizedFilename}
 *
 * Categories are grouped into sensitivity tiers for display, and each has an
 * upload/edit policy and a read policy:
 *
 *   🔴 Confidential
 *     employee-records      upload+read -> admin
 *     company-confidential  upload+read -> admin
 *   🟠 Leadership
 *     architecture          upload+read -> lead, admin
 *     project-docs          upload+read -> lead, admin
 *     meeting-notes         upload+read -> lead, admin
 *   🟢 Company-wide
 *     policies              upload -> admin;        read -> everyone
 *     resources             upload -> lead, admin;  read -> everyone
 *   🔵 User-generated
 *     task-files            upload -> user/lead/admin; read -> owner + lead/admin
 *     personal-files        upload -> everyone(own);  read -> owner + admin
 */

export const STORAGE_CATEGORIES = [
  'employee-records',
  'company-confidential',
  'architecture',
  'project-docs',
  'meeting-notes',
  'policies',
  'resources',
  'task-files',
  'personal-files',
] as const;

export type StorageCategory = (typeof STORAGE_CATEGORIES)[number];

export type StorageTier = 'confidential' | 'leadership' | 'company-wide' | 'user';

/** Display order for the tier headings in the documents sidebar. */
export const STORAGE_TIERS: { id: StorageTier; label: string }[] = [
  { id: 'confidential', label: 'Confidential' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'company-wide', label: 'Company-wide' },
  { id: 'user', label: 'My Files' },
];

export interface CategoryMeta {
  label: string;
  tier: StorageTier;
  description: string;
}

/** Human-facing metadata used to render the documents directory. */
export const CATEGORY_META: Record<StorageCategory, CategoryMeta> = {
  'employee-records': {
    label: 'Employee Records',
    tier: 'confidential',
    description: 'Contracts, IDs, tax, salary — HR only.',
  },
  'company-confidential': {
    label: 'Company Confidential',
    tier: 'confidential',
    description: 'Legal, finance, incorporation, board documents.',
  },
  architecture: {
    label: 'Architecture & Technical',
    tier: 'leadership',
    description: 'System design, blueprints, schemas, tech specs.',
  },
  'project-docs': {
    label: 'Project Documents',
    tier: 'leadership',
    description: 'Plans, requirements, roadmaps, PRDs.',
  },
  'meeting-notes': {
    label: 'Meeting Notes',
    tier: 'leadership',
    description: 'Minutes, decisions, action items.',
  },
  policies: {
    label: 'Policies & Handbook',
    tier: 'company-wide',
    description: 'Handbook, HR policies, SOPs, compliance.',
  },
  resources: {
    label: 'Templates & Resources',
    tier: 'company-wide',
    description: 'Document templates, brand assets, guides.',
  },
  'task-files': {
    label: 'Task & Assignment Files',
    tier: 'user',
    description: 'Assignment submissions and deliverables.',
  },
  'personal-files': {
    label: 'My Personal Files',
    tier: 'user',
    description: 'Your own private workspace files.',
  },
};

/** Roles allowed to UPLOAD / EDIT files in each category. */
export const CATEGORY_UPLOAD_ROLES: Record<StorageCategory, readonly AppRole[]> = {
  'employee-records': ['admin'],
  'company-confidential': ['admin'],
  architecture: ['lead', 'admin'],
  'project-docs': ['lead', 'admin'],
  'meeting-notes': ['lead', 'admin'],
  policies: ['admin'],
  resources: ['lead', 'admin'],
  'task-files': ['user', 'lead', 'admin'],
  'personal-files': ['user', 'lead', 'admin'],
};

/**
 * Roles allowed to READ / DOWNLOAD files in each category by virtue of their
 * role alone. Owner-based access is layered on top (see OWNER_READABLE below).
 */
export const CATEGORY_READ_ROLES: Record<StorageCategory, readonly AppRole[]> = {
  'employee-records': ['admin'],
  'company-confidential': ['admin'],
  architecture: ['lead', 'admin'],
  'project-docs': ['lead', 'admin'],
  'meeting-notes': ['lead', 'admin'],
  policies: ['user', 'lead', 'admin'],
  resources: ['user', 'lead', 'admin'],
  'task-files': ['lead', 'admin'],
  'personal-files': ['admin'],
};

/**
 * Categories where the file's owner may always read their own file, regardless
 * of role. Everyone effectively "owns" a slice of these (their own {uid}/...).
 */
export const OWNER_READABLE_CATEGORIES: readonly StorageCategory[] = [
  'task-files',
  'personal-files',
];

export function isStorageCategory(value: unknown): value is StorageCategory {
  return (
    typeof value === 'string' &&
    (STORAGE_CATEGORIES as readonly string[]).includes(value)
  );
}

/** Whether `role` may upload/edit into `category`. */
export function canUploadToCategory(role: string, category: StorageCategory): boolean {
  return (CATEGORY_UPLOAD_ROLES[category] as readonly string[]).includes(role);
}

/**
 * Whether `role` may read from `category`. For owner-readable categories
 * (task-files, personal-files) the uploader may always read their own file.
 */
export function canReadCategory(
  role: string,
  category: StorageCategory,
  opts?: { isOwner?: boolean }
): boolean {
  if ((CATEGORY_READ_ROLES[category] as readonly string[]).includes(role)) {
    return true;
  }
  if (OWNER_READABLE_CATEGORIES.includes(category) && opts?.isOwner) {
    return true;
  }
  return false;
}

/**
 * Categories a role should SEE in the documents sidebar. Includes categories
 * readable by role, plus the owner-readable ones (everyone has their own
 * task-files / personal-files).
 */
export function getVisibleCategoriesForRole(role: string): StorageCategory[] {
  return STORAGE_CATEGORIES.filter(
    (category) =>
      (CATEGORY_READ_ROLES[category] as readonly string[]).includes(role) ||
      OWNER_READABLE_CATEGORIES.includes(category)
  );
}

/**
 * The visible categories for a role, grouped by tier and enriched with meta —
 * ready for the frontend to render a sectioned directory tree.
 */
export function getVisibleCategoryTree(
  role: string
): { tier: StorageTier; label: string; categories: (CategoryMeta & { id: StorageCategory })[] }[] {
  const visible = new Set(getVisibleCategoriesForRole(role));
  return STORAGE_TIERS.map(({ id, label }) => ({
    tier: id,
    label,
    categories: STORAGE_CATEGORIES.filter(
      (category) => visible.has(category) && CATEGORY_META[category].tier === id
    ).map((category) => ({ id: category, ...CATEGORY_META[category] })),
  })).filter((group) => group.categories.length > 0);
}

/** Build a category-prefixed object key: {category}/{uid}/{timestamp}-{name}. */
export function buildStorageKey(
  category: StorageCategory,
  uid: string,
  filename: string
): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9.\-]/g, '_');
  return `${category}/${uid}/${Date.now()}-${sanitized}`;
}

/** Parse `{category}/{ownerUid}/...` back out of a key. Returns null if malformed. */
export function parseStorageKey(
  key: string
): { category: StorageCategory; ownerUid: string } | null {
  const parts = key.split('/');
  if (parts.length < 3) return null;
  const [category, ownerUid] = parts;
  if (!isStorageCategory(category) || !ownerUid) return null;
  return { category, ownerUid };
}
