/**
 * @hapulse/dashboard — public package entrypoint.
 *
 * Host apps (e.g. a Next.js SaaS wrapper) import from here.
 * The host is responsible for importing the stylesheet separately:
 *   import '@hapulse/dashboard/styles.css'
 */

export { DashboardApp } from './app/DashboardApp';
export { setPersistenceAdapter, getPersistenceAdapter } from './persistence';
export type { PersistenceAdapter } from './persistence';
