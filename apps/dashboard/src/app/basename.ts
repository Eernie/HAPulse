/**
 * Holds the router basename so non-React modules (the connectionStore HA OAuth
 * flow) can build basename-aware URLs. Set once by DashboardApp on mount. Empty
 * for the open-source build (mounted at '/'); '/app' for the SaaS host.
 */
let _basename = '';

export function setAppBasename(basename: string | undefined): void {
  _basename = basename && basename !== '/' ? basename.replace(/\/+$/, '') : '';
}

export function getAppBasename(): string {
  return _basename;
}

/**
 * The Home Assistant OAuth redirect URL — the onboarding page, basename-aware.
 * OSS → `${origin}/onboarding`; SaaS (basename '/app') → `${origin}/app/onboarding`.
 */
export function onboardingRedirectUrl(): string {
  return `${window.location.origin}${_basename}/onboarding`;
}
