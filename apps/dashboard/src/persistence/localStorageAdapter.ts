import type { PersistenceAdapter } from './types';

/**
 * Default persistence adapter — browser localStorage. Used by the open-source
 * build (and as a safe fallback). Synchronous, so settingsStore hydrates
 * synchronously and there is no first-paint flash of default settings.
 *
 * All access is guarded: localStorage can throw (Safari private mode, disabled
 * storage, quota). On failure we degrade to in-memory defaults rather than crash.
 */
export const localStorageAdapter: PersistenceAdapter = {
  getItem(name) {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* quota / unavailable — ignore */
    }
  },
  removeItem(name) {
    try {
      localStorage.removeItem(name);
    } catch {
      /* unavailable — ignore */
    }
  },
};
