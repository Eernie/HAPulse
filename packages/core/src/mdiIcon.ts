/**
 * MDI icon name utilities — pure, no DOM.
 *
 * Home Assistant stores icons as kebab-case strings with an `mdi:` prefix
 * (e.g. "mdi:sofa-outline"). The `@mdi/js` package exports each icon's SVG path
 * under a camelCase identifier prefixed with `mdi` (e.g. `mdiSofaOutline`).
 *
 * `mdiIconExportName` converts the former to the latter so the dashboard can
 * look the path up and render it directly — giving full fidelity to whatever
 * icon the user picked in Home Assistant, instead of mapping onto a small
 * curated set.
 *
 * Kept React-/DOM-free so the future mobile app can reuse it.
 */

/**
 * Convert a Home Assistant icon string to its `@mdi/js` export name.
 *
 *   "mdi:sofa-outline" → "mdiSofaOutline"
 *   "sofa"             → "mdiSofa"        (bare names are accepted too)
 *   "numeric-1-box"    → "mdiNumeric1Box"
 *
 * Returns `null` when the string can't map to an MDI export: empty/whitespace,
 * a non-`mdi` namespace (e.g. "hass:foo"), or characters outside [a-z0-9-].
 * The caller is still responsible for checking the name exists in `@mdi/js`
 * (unknown icons resolve to `undefined` there).
 */
export function mdiIconExportName(haIcon: string | null | undefined): string | null {
  if (!haIcon) return null;

  let name = haIcon.trim().toLowerCase();
  if (name.startsWith('mdi:')) name = name.slice(4);

  // Reject other icon packs (namespaced with a different prefix).
  if (name.includes(':')) return null;

  // MDI names are kebab-case alphanumerics; anything else can't be an export.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) return null;

  const pascal = name
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');

  return `mdi${pascal}`;
}
