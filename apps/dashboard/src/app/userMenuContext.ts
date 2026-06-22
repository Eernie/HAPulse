import { createContext } from 'react';
import type { ReactNode } from 'react';

/**
 * Host-supplied dropdown menu for the user avatar.
 *
 * When provided (e.g. the SaaS host injects an account/sign-out menu), an
 * interactive UserAvatar becomes a dropdown trigger rendering this content
 * instead of navigating to /settings. Undefined in the open-source build, where
 * the avatar keeps its navigate-to-settings behavior. Because UserAvatar reads
 * this via context, the menu attaches to the avatar on every breakpoint (the
 * desktop header cluster AND the mobile page header) with no per-page wiring.
 */
export const UserMenuContext = createContext<ReactNode>(undefined);

export type DashboardNavigate = (to: string) => void;

/**
 * In-SPA navigation provided to the host menu so it can route within the
 * dashboard (e.g. a "Dashboard settings" item) without a full page reload.
 * UserAvatar supplies a function that also closes the dropdown. The host imports
 * this context from `@hapulse/dashboard/menu-context` (a lightweight subpath that
 * does NOT load the stores, preserving the adapter-injection ordering).
 */
export const DashboardNavContext = createContext<DashboardNavigate | null>(null);
