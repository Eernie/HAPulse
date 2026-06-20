/**
 * PersistenceAdapter — the storage backend for the user's *synced* settings:
 * `settingsStore` (theme / mode / accent / userName / sidebar + the whole
 * `customization` JSON). This is the open-core seam: the open-source build uses
 * localStorage; the SaaS build injects a Supabase-backed, auth-scoped adapter.
 *
 * IMPORTANT — what does NOT go through this seam: the Home Assistant connection
 * and tokens (`connectionStore` → `hapulse:connection` / `hapulse:ha-tokens`)
 * stay in localStorage in EVERY build. The HA token is a full home-control
 * credential and never leaves the browser (see docs/PLAN.md, "HA token storage
 * in SaaS — client-side only"). Only non-sensitive settings sync.
 *
 * The shape matches zustand's `StateStorage` and may be synchronous (localStorage)
 * or asynchronous (a network-backed adapter returns Promises).
 */
export interface PersistenceAdapter {
  getItem(name: string): string | null | Promise<string | null>;
  setItem(name: string, value: string): void | Promise<void>;
  removeItem(name: string): void | Promise<void>;
}
