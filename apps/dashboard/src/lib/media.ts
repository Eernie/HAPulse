/**
 * Media helpers shared across the music cards.
 */

/**
 * Resolve a media player's `entity_picture` into a usable image URL.
 *
 * HA serves its own artwork as a **relative** path (e.g.
 * `/api/media_player_proxy/media_player.spotify?token=…`) which must be joined
 * with the HA base URL. But some integrations (Spotify, Cast, …) put an
 * **absolute** URL in `entity_picture` (e.g. `https://i.scdn.co/image/…`).
 * Blindly prefixing those with the base URL yields a broken
 * `http://ha-host:8123https://i.scdn.co/…` that fails to resolve.
 *
 * @returns an absolute URL, or `null` when there is no usable picture.
 */
export function resolveEntityPicture(
  picture: string | null | undefined,
  baseUrl: string | null,
): string | null {
  if (!picture) return null;
  // Already absolute (http/https) or a data: URI — use as-is.
  if (/^(https?:)?\/\//i.test(picture) || picture.startsWith('data:')) {
    return picture;
  }
  if (!baseUrl) return picture; // relative; let the browser resolve against origin
  return `${baseUrl}${picture.startsWith('/') ? '' : '/'}${picture}`;
}
