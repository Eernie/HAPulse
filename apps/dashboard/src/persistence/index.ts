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
