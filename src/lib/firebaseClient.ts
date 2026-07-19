/**
 * Compatibility re-export.
 *
 * The Firebase browser client is initialized in exactly one place:
 * `src/config/firebaseConfig.ts`. This module used to call `initializeApp`
 * a second time, which meant the app had two initialization sites and the
 * dashboards imported `db` from here while auth came from the config file.
 *
 * Keeping this file as a thin re-export means the existing
 * `@/lib/firebaseClient` imports across the dashboards keep working while
 * everything now shares a single Firebase app / auth / firestore instance.
 *
 * Prefer importing from `@/config/firebaseConfig` in new code.
 */
export { auth, db, default as app } from '@/config/firebaseConfig';
