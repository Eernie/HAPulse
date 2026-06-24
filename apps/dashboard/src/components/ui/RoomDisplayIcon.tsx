/**
 * RoomDisplayIcon — renders a room's icon as a Material Design Icon, for both
 * the identity icon (from the room's HA icon) and computed status icons (open
 * door/window, moisture, smoke). Using MDI for both avoids mixing icon styles
 * within a room card/row.
 *
 * Falls back to the curated lucide RoomIcon when an icon can't be resolved
 * (HA has no usable mdi: icon, or — for status — an unmapped condition).
 *
 * Status icons are computed (not from HA), so `roomStatusIconName` returns a
 * lucide canonical name; STATUS_MDI maps those to equivalent MDI icons.
 */

import React from 'react';
import { MdiIcon } from './MdiIcon';
import { RoomIcon } from './RoomIcon';

/**
 * Maps the lucide canonical status names returned by `roomStatusIconName`
 * (see packages/core/src/roomIcons.ts) to equivalent MDI icon strings.
 */
const STATUS_MDI: Record<string, string> = {
  'door-open': 'mdi:door-open', // open door
  'car': 'mdi:garage-open', // open garage door
  'grid-2x2': 'mdi:window-open-variant', // open window / opening
  'droplets': 'mdi:water-alert', // moisture detected
  'flame': 'mdi:smoke-detector-alert', // smoke detected
};

interface RoomDisplayIconProps {
  /** The room's raw HA icon string for the identity icon, e.g. "mdi:sofa". */
  roomIcon?: string | null | undefined;
  /** Resolved icon name from roomDisplayIcon (lucide canonical). */
  iconName: string;
  /** Whether iconName is a status icon (vs the room identity icon). */
  isStatus: boolean;
  size?: number;
  className?: string | undefined;
}

export function RoomDisplayIcon({
  roomIcon,
  iconName,
  isStatus,
  size = 20,
  className,
}: RoomDisplayIconProps) {
  // Status → mapped MDI string; identity → the room's own HA icon.
  const mdiIcon = isStatus ? STATUS_MDI[iconName] ?? null : roomIcon ?? null;

  return (
    <MdiIcon
      icon={mdiIcon}
      size={size}
      className={className}
      fallback={<RoomIcon name={iconName} size={size} className={className} />}
    />
  );
}
