/**
 * roomIcon helper — combines identity + status icon resolution for a Room.
 */

import { roomIconName, roomStatusIconName } from '@hapulse/core';
import type { Room, HassEntityMap } from '@hapulse/core';

/**
 * Returns the display icon name for a room:
 * - If a status condition is active (open door/window, moisture, smoke),
 *   returns the status icon name and sets isStatus = true.
 * - Otherwise returns the room's identity icon name.
 *
 * Pass hiddenEntityIds so that hidden sensors don't trigger a status icon.
 */
export function roomDisplayIcon(
  room: Room,
  entities: HassEntityMap,
  hiddenEntityIds: readonly string[] = [],
): { iconName: string; isStatus: boolean } {
  const visibleEntities: HassEntityMap =
    hiddenEntityIds.length === 0
      ? entities
      : Object.fromEntries(
          Object.entries(entities).filter(([id]) => !hiddenEntityIds.includes(id))
        );
  const statusIcon = roomStatusIconName(room, visibleEntities);
  if (statusIcon !== null) {
    return { iconName: statusIcon, isStatus: true };
  }
  return {
    iconName: roomIconName({ name: room.name, icon: room.icon ?? null }),
    isStatus: false,
  };
}
