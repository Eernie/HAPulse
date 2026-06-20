/**
 * HAPulse dashboard — entry point.
 *
 * Order of operations:
 * 1. Apply saved theme immediately (before React hydrates) — prevents flash.
 * 2. Call connectionStore.init() to auto-reconnect from persisted credentials.
 * 3. Render the React tree.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

// Global styles (fonts, reset, theme tokens, grain overlay)
import './styles/global.css';

import { applyTheme, watchSystemMode, THEME_NAMES } from './theme/themes';
import type { ThemeName, ThemeMode } from './theme/themes';
import { useSettingsStore } from './stores/settingsStore';
import { useConnectionStore } from './stores/connectionStore';
import { AppRouter } from './app/Router';

// Map any legacy persisted theme value to the current { theme, mode } model.
function legacyTheme(value: string | undefined): { theme: ThemeName; mode: ThemeMode } {
  if (value && (THEME_NAMES as readonly string[]).includes(value)) {
    return { theme: value as ThemeName, mode: 'light' };
  }
  switch (value) {
    case 'dusk': return { theme: 'sunset', mode: 'dark' };
    case 'dawn': return { theme: 'sunset', mode: 'light' };
    case 'midnight': return { theme: 'ocean', mode: 'dark' };
    case 'sage': return { theme: 'forest', mode: 'light' };
    default: return { theme: 'aurora', mode: 'light' };
  }
}

// ---------------------------------------------------------------------------
// 1. Apply theme + mode before first paint — read directly from localStorage
//    (the Zustand persist store hasn't hydrated yet at this point)
// ---------------------------------------------------------------------------
(function initTheme() {
  let theme: ThemeName = 'aurora';
  let mode: ThemeMode = 'light';
  let accentHue: number | undefined;
  try {
    const raw = localStorage.getItem('hapulse:settings');
    if (raw) {
      const settings = JSON.parse(raw) as {
        state?: { theme?: string; mode?: ThemeMode; accentHue?: number };
      };
      const legacy = legacyTheme(settings?.state?.theme);
      theme = legacy.theme;
      mode =
        settings?.state?.mode === 'light' || settings?.state?.mode === 'dark' || settings?.state?.mode === 'auto'
          ? settings.state.mode
          : legacy.mode;
      accentHue = settings?.state?.accentHue;
    }
  } catch {
    // fall through to defaults
  }
  // Always apply — sets data-theme/data-mode and tokens even on first run.
  applyTheme(theme, mode, accentHue);
})();

// ---------------------------------------------------------------------------
// 2. Keep the DOM in sync with settings changes AND the OS color scheme.
// ---------------------------------------------------------------------------
useSettingsStore.subscribe((state) => {
  applyTheme(state.theme, state.mode, state.accentHue);
});

watchSystemMode(() => {
  const s = useSettingsStore.getState();
  return { theme: s.theme, mode: s.mode, accentHue: s.accentHue };
});

// ---------------------------------------------------------------------------
// 3. Kick off auto-reconnect from persisted credentials (async, non-blocking)
// ---------------------------------------------------------------------------
useConnectionStore.getState().init();

// ---------------------------------------------------------------------------
// 4. Render
// ---------------------------------------------------------------------------
const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('[HAPulse] No #root element found in index.html');

createRoot(rootEl).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
