/**
 * HAPulse theme system — DOM façade over @hapulse/core's pure theme data.
 *
 * The token data (identities × light/dark), `ThemeTokens`/`ThemeName`/
 * `ThemeMode`/`ResolvedMode` types, and the pure mode/accent-hue math now
 * live in `@hapulse/core` (so the mobile app can reuse them without pulling
 * in any DOM code). This file keeps only the browser-specific parts: writing
 * CSS custom properties onto `<html>`, reading `matchMedia` for the OS
 * preference, and watching for OS theme changes.
 *
 * Tokens are applied to :root as CSS custom properties by applyTheme() — there
 * are no per-theme blocks in global.css (only a default fallback for first
 * paint). Component CSS references the variables and is theme/mode agnostic.
 */

import {
  THEMES,
  THEME_NAMES,
  THEME_LABELS,
  resolveThemeMode,
  accentOverride,
} from '@hapulse/core';
import type { ThemeName, ThemeMode, ResolvedMode, ThemeTokens } from '@hapulse/core';

export { THEMES, THEME_NAMES, THEME_LABELS };
export type { ThemeName, ThemeMode, ResolvedMode, ThemeTokens };

// ---------------------------------------------------------------------------
// CSS variable mapping
// ---------------------------------------------------------------------------

const TOKEN_TO_VAR: Record<keyof ThemeTokens, string> = {
  bg: '--bg',
  bgRaised: '--bg-raised',
  bgCard: '--bg-card',
  bgCardHover: '--bg-card-hover',
  bgSubtle: '--bg-subtle',
  text: '--text',
  textDim: '--text-dim',
  textFaint: '--text-faint',
  accent: '--accent',
  accentSoft: '--accent-soft',
  onAccent: '--on-accent',
  line: '--line',
  border: '--border',
  positive: '--positive',
  positiveSoft: '--positive-soft',
  warning: '--warning',
  warningSoft: '--warning-soft',
  danger: '--danger',
  dangerSoft: '--danger-soft',
  info: '--info',
  infoSoft: '--info-soft',
  shadowCard: '--shadow-card',
  shadowElevated: '--shadow-elevated',
  shadowActive: '--shadow-active',
};

// ---------------------------------------------------------------------------
// Mode resolution
// ---------------------------------------------------------------------------

const darkMql = (): MediaQueryList | null =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

/** Resolve 'auto' to the concrete light/dark based on the OS preference. */
export function resolveMode(mode: ThemeMode): ResolvedMode {
  return resolveThemeMode(mode, darkMql()?.matches ?? false);
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

function isValidTheme(name: string): name is ThemeName {
  return (THEME_NAMES as readonly string[]).includes(name);
}

/**
 * Apply a theme + mode to <html>, optionally overriding the accent hue.
 *
 * Writes every design token as an inline CSS custom property on :root, sets
 * `data-theme`, `data-mode`, and `color-scheme`. Inline props always win over
 * the :root fallback block in global.css.
 */
export function applyTheme(name: ThemeName, mode: ThemeMode = 'light', accentHue?: number): void {
  const root = document.documentElement;
  const theme: ThemeName = isValidTheme(name) ? name : 'aurora';
  const resolved = resolveMode(mode);
  const tokens = THEMES[theme][resolved];

  for (const key of Object.keys(TOKEN_TO_VAR) as (keyof ThemeTokens)[]) {
    root.style.setProperty(TOKEN_TO_VAR[key], tokens[key]);
  }

  root.setAttribute('data-theme', theme);
  root.setAttribute('data-mode', resolved);
  root.style.setProperty('color-scheme', resolved);

  if (accentHue !== undefined) {
    const override = accentOverride(accentHue, resolved);
    root.style.setProperty('--accent', override.accent);
    root.style.setProperty('--accent-soft', override.accentSoft);
    root.style.setProperty('--on-accent', override.onAccent);
  }
}

let systemListener: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * Keep the document in sync with the OS color scheme while mode === 'auto'.
 * Call whenever the theme/mode changes. Pass a getter so the latest values are
 * read when the system flips. Returns a cleanup function.
 */
export function watchSystemMode(getState: () => { theme: ThemeName; mode: ThemeMode; accentHue?: number | undefined }): () => void {
  const mql = darkMql();
  if (!mql) return () => {};

  if (systemListener) {
    mql.removeEventListener('change', systemListener);
    systemListener = null;
  }

  systemListener = () => {
    const { theme, mode, accentHue } = getState();
    if (mode === 'auto') applyTheme(theme, mode, accentHue);
  };
  mql.addEventListener('change', systemListener);

  return () => {
    if (systemListener) {
      mql.removeEventListener('change', systemListener);
      systemListener = null;
    }
  };
}

/** Read the current theme identity from <html>. Falls back to 'aurora'. */
export function getCurrentTheme(): ThemeName {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr && isValidTheme(attr) ? attr : 'aurora';
}
