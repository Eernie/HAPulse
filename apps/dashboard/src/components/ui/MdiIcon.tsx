/**
 * MdiIcon — renders a Material Design Icon straight from a Home Assistant icon
 * string (e.g. "mdi:sofa-outline").
 *
 * `@mdi/js` is a single ~2.7 MB module exporting every icon's SVG path, so it is
 * **dynamically imported** (code-split into its own chunk) the first time any
 * MdiIcon mounts, then cached module-wide. Subsequent icons resolve synchronously
 * from the cache with no flash.
 *
 * The HA string is converted to the export name via `mdiIconExportName`
 * (mdi:sofa-outline → mdiSofaOutline). If the icon can't be resolved (unknown
 * name, other icon pack, still loading on first paint) the `fallback` is shown,
 * so callers can pass their existing lucide icon as a safety net.
 */

import React, { useEffect, useState } from 'react';
import { mdiIconExportName } from '@hapulse/core';

type MdiModule = Record<string, string>;

// Module-wide cache so the 2.7 MB icon module loads at most once.
let mdiModule: MdiModule | null = null;
let mdiPromise: Promise<MdiModule> | null = null;

function loadMdi(): Promise<MdiModule> {
  if (mdiModule) return Promise.resolve(mdiModule);
  if (!mdiPromise) {
    mdiPromise = import('@mdi/js').then((mod) => {
      mdiModule = mod as unknown as MdiModule;
      return mdiModule;
    });
  }
  return mdiPromise;
}

/** Resolve a path synchronously if the module is already cached, else undefined. */
function resolvePath(exportName: string | null): string | null | undefined {
  if (!exportName) return null; // not an MDI icon → use fallback immediately
  if (!mdiModule) return undefined; // not loaded yet
  return mdiModule[exportName] ?? null; // loaded: path or "unknown" (null)
}

interface MdiIconProps {
  /** The raw Home Assistant icon string, e.g. "mdi:sofa-outline". */
  icon: string | null | undefined;
  size?: number;
  className?: string | undefined;
  /** Rendered while loading, or when the icon can't be resolved. */
  fallback?: React.ReactNode;
}

export function MdiIcon({ icon, size = 20, className, fallback = null }: MdiIconProps) {
  const exportName = mdiIconExportName(icon);
  const [path, setPath] = useState<string | null | undefined>(() => resolvePath(exportName));

  useEffect(() => {
    // Re-resolve when the icon changes (covers cache-already-warm too).
    const sync = resolvePath(exportName);
    if (sync !== undefined) {
      setPath(sync);
      return;
    }
    // Not cached yet — load the module, then resolve.
    let active = true;
    setPath(undefined);
    void loadMdi().then((mod) => {
      if (active) setPath(exportName ? mod[exportName] ?? null : null);
    });
    return () => {
      active = false;
    };
  }, [exportName]);

  if (!path) return <>{fallback}</>;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}
