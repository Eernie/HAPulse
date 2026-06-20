/**
 * Security page local utilities — room name resolution and entity helpers.
 */

import type { Room } from '@hapulse/core';

/** Return the room name for an entity ID, or undefined if not found. */
export function getRoomName(entityId: string, rooms: Room[]): string | undefined {
  return rooms.find((r) => r.entityIds.includes(entityId))?.name;
}

/**
 * Format a relative time string for a last-changed timestamp.
 * e.g. "4m ago", "2h ago", "just now"
 */
export function relativeTime(isoString: string): string {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 30) return 'just now';
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
