/**
 * Typed errors thrown by @hapulse/core connection utilities.
 */

/** Thrown when the HA access token is rejected (ERR_INVALID_AUTH). */
export class HAAuthError extends Error {
  override readonly name = 'HAAuthError';
  readonly code = 'ERR_INVALID_AUTH' as const;

  constructor(message = 'Invalid Home Assistant access token') {
    super(message);
  }
}

/** Thrown when the connection to HA cannot be established (network, URL, CORS, etc.). */
export class HAConnectionError extends Error {
  override readonly name = 'HAConnectionError';
  readonly code = 'ERR_CANNOT_CONNECT' as const;

  constructor(message = 'Cannot connect to Home Assistant', cause?: unknown) {
    super(message, { cause });
  }
}
