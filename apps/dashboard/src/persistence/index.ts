/**
 * Persistence seam — the single place that decides WHERE synced settings live.
 *
 * The open-source build uses the default localStorage adapter (nothing to do).
 * The SaaS build calls `setPersistenceAdapter(supabaseAdapter)` ONCE at boot
 * (before React renders) so `settingsStore` loads/saves the signed-in user's
 * settings from their account. The HA connection/token layer is unaffected and
 * stays client-side in every build (see ./types).
 */
import type { PersistenceAdapter } from './types';
import { localStorageAdapter } from './localStorageAdapter';

export type { PersistenceAdapter } from './types';
export { localStorageAdapter } from './localStorageAdapter';

let activeAdapter: PersistenceAdapter = localStorageAdapter;

/**
 * Replace the settings persistence backend. Must be called before the settings
 * store first hydrates (i.e. before rendering the app). The dynamic storage in
 * ./zustandStorage reads the active adapter on every operation, so this swap
 * takes effect regardless of module import order.
 */
export function setPersistenceAdapter(adapter: PersistenceAdapter): void {
  activeAdapter = adapter;
}

/** The currently active settings persistence adapter (default: localStorage). */
export function getPersistenceAdapter(): PersistenceAdapter {
  return activeAdapter;
}

/**
 * True when no SaaS adapter has been installed — i.e. this is the open-source
 * build running against the default localStorage adapter. Used to gate
 * open-source-only behavior (like syncing settings into Home Assistant's
 * `frontend/user_data`) so it stays completely inert once a hosted build
 * calls `setPersistenceAdapter` with a Supabase-backed adapter.
 */
export function isDefaultPersistenceAdapter(): boolean {
  return activeAdapter === localStorageAdapter;
}
