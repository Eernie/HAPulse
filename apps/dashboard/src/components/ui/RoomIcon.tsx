/**
 * RoomIcon — renders the lucide icon for a room by canonical name.
 *
 * Maps exactly the CANONICAL_ROOM_ICONS set from @hapulse/core/roomIcons.
 * When adding icons to CANONICAL_ROOM_ICONS, add the corresponding import
 * and entry to ICON_MAP here.
 *
 * @see packages/core/src/roomIcons.ts (source of CANONICAL_ROOM_ICONS)
 */

import React from 'react';
import {
  Sofa,
  Utensils,
  Bed,
  Baby,
  Bath,
  Monitor,
  Car,
  DoorOpen,
  WashingMachine,
  Trees,
  Box,
  Triangle,
  Dumbbell,
  Shirt,
  Waves,
  Clapperboard,
  Gamepad2,
  House,
  Grid2x2,
  Droplets,
  Flame,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type LucideIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
>;

/**
 * Mirrors CANONICAL_ROOM_ICONS from packages/core/src/roomIcons.ts.
 * Keep in sync when adding icons there.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  // Room identity
  'sofa': Sofa,
  'utensils': Utensils,
  'bed': Bed,
  'baby': Baby,
  'bath': Bath,
  'monitor': Monitor,
  'car': Car,
  'door-open': DoorOpen,
  'washing-machine': WashingMachine,
  'trees': Trees,
  'box': Box,
  'triangle': Triangle,
  'dumbbell': Dumbbell,
  'shirt': Shirt,
  'waves': Waves,
  'clapperboard': Clapperboard,
  'gamepad-2': Gamepad2,
  'house': House,
  // Status icons
  'grid-2x2': Grid2x2,
  'droplets': Droplets,
  'flame': Flame,
};

interface RoomIconProps {
  /** A lucide icon name from CANONICAL_ROOM_ICONS. Unknown names render House. */
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function RoomIcon({ name, size = 20, strokeWidth = 1.75, className }: RoomIconProps) {
  const IconComponent = ICON_MAP[name] ?? House;
  return <IconComponent size={size} strokeWidth={strokeWidth} className={className} />;
}
