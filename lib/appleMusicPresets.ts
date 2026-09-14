export interface AppleMusicPreset {
  id: string;
  name: string;
  playlistId: string;
}

export const APPLE_MUSIC_PRESETS: AppleMusicPreset[] = [
  { id: 'lofi-chill', name: 'Lo-Fi Chill & Study Beats', playlistId: 'pl.u-mJy81N4tz9oKq' },
  { id: 'pure-focus', name: 'Pure Focus: Instrumental', playlistId: 'pl.u-2aoq8mNTGEVp4' },
  { id: 'rain-cafe', name: 'Rain & Cafe Ambient', playlistId: 'pl.u-xlyNq7VuJ8lW3' },
  { id: 'classical-piano', name: 'Classical Study Piano', playlistId: 'pl.u-76oNkDvFvY7B5' },
];

/** Builds the official Apple Music embed URL for a bare playlist id (e.g. "pl.u-mJy81N4tz9oKq"). */
export function buildPlaylistEmbedUrl(playlistId: string): string {
  return `https://embed.music.apple.com/us/playlist/study/${playlistId}`;
}

const SHARE_URL_RE = /^https?:\/\/(?:embed\.)?music\.apple\.com\/(.+)$/i;
const BARE_PLAYLIST_ID_RE = /^pl\.[A-Za-z0-9_-]+$/;

/**
 * Resolves any user-pasted Apple Music input — a full song/album/playlist
 * share link, an already-embed link, or a bare playlist id — into a playable
 * embed.music.apple.com URL. Returns null when the input doesn't look like
 * anything Apple Music would recognize.
 */
export function resolveAppleMusicEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const shareMatch = trimmed.match(SHARE_URL_RE);
  if (shareMatch) return `https://embed.music.apple.com/${shareMatch[1]}`;

  if (BARE_PLAYLIST_ID_RE.test(trimmed)) return buildPlaylistEmbedUrl(trimmed);

  return null;
}
