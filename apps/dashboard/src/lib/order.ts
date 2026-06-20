/**
 * order.ts — pure, dependency-free ordering utilities.
 */

/**
 * Apply a stored order to a list of ids.
 *
 * IDs present in `stored` come first (in stored order), followed by any
 * remaining ids from the original `ids` array in their natural order.
 *
 * - If `stored` is undefined or empty, `ids` is returned as-is.
 * - IDs in `stored` but absent from `ids` are silently skipped.
 */
export function applyStoredOrder(ids: string[], stored: string[] | undefined): string[] {
  if (!stored || stored.length === 0) return ids;

  const idSet = new Set(ids);
  const ordered: string[] = [];

  // First: ids present in stored, in stored order
  for (const id of stored) {
    if (idSet.has(id)) {
      ordered.push(id);
      idSet.delete(id);
    }
  }

  // Then: remaining ids in their original natural order
  for (const id of ids) {
    if (idSet.has(id)) {
      ordered.push(id);
    }
  }

  return ordered;
}
