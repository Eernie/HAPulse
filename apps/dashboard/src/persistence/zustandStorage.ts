import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { getPersistenceAdapter } from './index';

/** Apply `fn` to a value that may or may not be a Promise, preserving sync-ness. */
function mapMaybePromise<T, R>(value: T | Promise<T>, fn: (v: T) => R): R | Promise<R> {
  return value instanceof Promise ? value.then(fn) : fn(value);
}

/**
 * A zustand `PersistStorage` that resolves the active {@link getPersistenceAdapter}
 * on EVERY operation and JSON-encodes values the way `createJSONStorage` does.
 *
 * Two reasons we don't just use `createJSONStorage(() => getPersistenceAdapter())`:
 *  1. `createJSONStorage` captures its backend once at store-creation time, which
 *     would make `setPersistenceAdapter` depend on import order. Reading the
 *     adapter per-operation removes that ordering hazard.
 *  2. We preserve synchronicity: when the adapter is synchronous (localStorage),
 *     `getItem` returns synchronously, so the store hydrates synchronously and the
 *     open-source build behaves exactly as before (no first-paint flash). An async
 *     adapter (Supabase) returns Promises and zustand hydrates asynchronously.
 */
export function dynamicJSONStorage<S>(): PersistStorage<S> {
  return {
    getItem(name) {
      return mapMaybePromise(getPersistenceAdapter().getItem(name), (str) => {
        if (str == null) return null;
        try {
          return JSON.parse(str) as StorageValue<S>;
        } catch {
          return null;
        }
      });
    },
    setItem(name, value) {
      return getPersistenceAdapter().setItem(name, JSON.stringify(value));
    },
    removeItem(name) {
      return getPersistenceAdapter().removeItem(name);
    },
  };
}
