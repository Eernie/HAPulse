/**
 * Mobile-friendly OAuth (authorization-code) helpers for Home Assistant.
 *
 * The dashboard's existing OAuth flow uses hajsw's `getAuth()` directly,
 * which relies on `window.location`/`document` to redirect the browser and
 * exchange the code (see `home-assistant-js-websocket`'s `auth.js`:
 * `redirectAuthorize` navigates via `document.location.href`, and
 * `tokenRequest` submits a `FormData` body via `fetch`, using
 * `document.createElement('a')` to sniff the hassUrl's protocol). None of
 * that is available (or desirable) in a React Native / Expo mobile app,
 * which instead opens a system browser / auth session for the authorize step
 * and hands the resulting `code` back to JS.
 *
 * These helpers provide the same two HTTP legs (build the authorize URL,
 * exchange the code for tokens) as plain, DOM-free functions, plus a way to
 * turn already-exchanged `AuthData` into a live `HAConnection` — all reusing
 * `@hapulse/core`'s error-mapping conventions.
 */

import { Auth, createConnection, ERR_CANNOT_CONNECT, ERR_INVALID_AUTH } from 'home-assistant-js-websocket';
import type { AuthData } from 'home-assistant-js-websocket';
import { HAAuthError, HAConnectionError } from './errors.js';
import { HAConnection } from './connection.js';

/** Options for buildHAAuthorizeUrl. */
export interface BuildHAAuthorizeUrlOptions {
  /** Home Assistant base URL, e.g. "http://homeassistant.local:8123" (trailing slash optional). */
  hassUrl: string;
  /** OAuth client ID. */
  clientId: string;
  /** The URI HA will redirect back to after the user authorizes, e.g. "hapulse://auth-callback". */
  redirectUri: string;
  /** Optional opaque state round-tripped back on redirect. */
  state?: string | undefined;
}

/**
 * Build the `/auth/authorize` URL to open in a browser / auth session.
 *
 * Normalizes `hassUrl` by stripping any trailing slash, then URL-encodes
 * `client_id`, `redirect_uri`, and (if present) `state`.
 */
export function buildHAAuthorizeUrl(opts: BuildHAAuthorizeUrlOptions): string {
  const hassUrl = opts.hassUrl.replace(/\/+$/, '');
  let url = `${hassUrl}/auth/authorize?client_id=${encodeURIComponent(opts.clientId)}&redirect_uri=${encodeURIComponent(opts.redirectUri)}`;
  if (opts.state !== undefined) {
    url += `&state=${encodeURIComponent(opts.state)}`;
  }
  return url;
}

/** Options for exchangeHAAuthCode. */
export interface ExchangeHAAuthCodeOptions {
  /** Home Assistant base URL (trailing slash optional). */
  hassUrl: string;
  /** OAuth client ID — must match the one used to build the authorize URL. */
  clientId: string;
  /** The authorization code returned in the redirect. */
  code: string;
}

/**
 * Exchange an OAuth authorization code for tokens via `POST /auth/token`.
 *
 * Home Assistant's token endpoint rejects JSON bodies — this sends a plain
 * `application/x-www-form-urlencoded` body, unlike hajsw's own
 * `tokenRequest()` (which builds a `FormData` body and requires DOM APIs).
 *
 * @throws {HAAuthError} on a 4xx response (invalid code, invalid client, etc.)
 * @throws {HAConnectionError} on network failure or an unexpected non-2xx response
 */
export async function exchangeHAAuthCode(opts: ExchangeHAAuthCodeOptions): Promise<AuthData> {
  const hassUrl = opts.hassUrl.replace(/\/+$/, '');
  const body = `grant_type=authorization_code&code=${encodeURIComponent(opts.code)}&client_id=${encodeURIComponent(opts.clientId)}`;

  let resp: Response;
  try {
    resp = await fetch(`${hassUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch (err: unknown) {
    throw new HAConnectionError(
      `Cannot reach Home Assistant to exchange the authorization code: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    if (resp.status >= 400 && resp.status < 500) {
      throw new HAAuthError(`Home Assistant rejected the authorization code (${resp.status}): ${text}`);
    }
    throw new HAConnectionError(`Unexpected response exchanging authorization code (${resp.status}): ${text}`);
  }

  const json = (await resp.json()) as { access_token: string; refresh_token: string; expires_in: number };

  return {
    hassUrl,
    clientId: opts.clientId,
    expires: Date.now() + json.expires_in * 1000,
    refresh_token: json.refresh_token,
    access_token: json.access_token,
    expires_in: json.expires_in,
  };
}

/** Options for connectWithAuthData. */
export interface ConnectWithAuthDataOptions {
  /** Previously obtained (or refreshed) token data — see exchangeHAAuthCode. */
  data: AuthData;
  /**
   * Persist tokens whenever hajsw refreshes them. Pass null to signal
   * "sign out / clear tokens".
   */
  saveTokens?: ((data: AuthData | null) => void) | undefined;
}

/**
 * Create a live HAConnection from already-exchanged AuthData.
 *
 * Equivalent to `connectToHA`'s long-lived-token path, but for the
 * authorization-code flow: builds an `Auth` instance directly from `data`
 * (skipping hajsw's DOM-dependent `getAuth()`), then opens the WebSocket
 * connection. Error mapping mirrors `connectToHA` in `./connection.js`.
 *
 * @throws {HAAuthError} when the tokens are rejected
 * @throws {HAConnectionError} when the host is unreachable
 */
export async function connectWithAuthData(opts: ConnectWithAuthDataOptions): Promise<HAConnection> {
  const auth = new Auth(opts.data, opts.saveTokens);

  try {
    const conn = await createConnection({ auth });
    return new HAConnection(conn, auth);
  } catch (err: unknown) {
    if (err === ERR_INVALID_AUTH) {
      throw new HAAuthError();
    }
    if (err === ERR_CANNOT_CONNECT) {
      throw new HAConnectionError('Cannot connect to Home Assistant. Check the URL and ensure the instance is reachable.');
    }
    throw new HAConnectionError(
      `Unexpected connection error: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  }
}
