export interface AppleMusicPreset {
  id: string;
  name: string;
  embedUrl: string;
}

export const APPLE_MUSIC_PRESETS: AppleMusicPreset[] = [
  { id: 'lofi-study', name: 'Lo-Fi Study Beats', embedUrl: 'https://embed.music.apple.com/us/playlist/lo-fi-jazz-chill/pl.u-mJy81N4tz9oKq' },
  { id: 'deep-focus', name: 'Deep Instrumental Focus', embedUrl: 'https://embed.music.apple.com/us/playlist/pure-focus/pl.u-2aoq8mNTGEVp4' },
  { id: 'rainy-cafe', name: 'Rainy Cafe Study', embedUrl: 'https://embed.music.apple.com/us/playlist/rainy-day-chill/pl.u-xlyNq7VuJ8lW3' },
  { id: 'classical-piano', name: 'Minimalist Classical Piano', embedUrl: 'https://embed.music.apple.com/us/playlist/classical-focus/pl.u-76oNkDvFvY7B5' },
  { id: 'ambient-drones', name: 'Ambient Soundscapes / Drones', embedUrl: 'https://embed.music.apple.com/us/playlist/ambient-chill/pl.u-aZb0NxdTPJ0zR' },
];

/** The 6th preset isn't an Apple Music embed — it toggles the in-browser Web Audio noise generators instead. */
export const NOISE_PRESET_ID = 'brown-white-noise';
export const NOISE_PRESET_NAME = 'Brown / White Noise Generators';

const SHARE_URL_RE = /^https?:\/\/(?:embed\.)?music\.apple\.com\/(.+)$/i;
const BARE_PLAYLIST_ID_RE = /^pl\.[A-Za-z0-9_-]+$/;

/** Builds the official Apple Music embed URL for a bare playlist id (e.g. "pl.u-mJy81N4tz9oKq"). */
export function buildPlaylistEmbedUrl(playlistId: string): string {
  return `https://embed.music.apple.com/us/playlist/study/${playlistId}`;
}

/**
 * Resolves any user-pasted Apple Music input — a full song/album/playlist
 * share link (https://music.apple.com/...), an already-embed link, or a bare
 * playlist id — into a playable embed.music.apple.com URL, rewriting the
 * host automatically so the player never needs manual URL surgery. Returns
 * null when the input doesn't look like anything Apple Music would recognize.
 */
export function resolveAppleMusicEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const shareMatch = trimmed.match(SHARE_URL_RE);
  if (shareMatch) return `https://embed.music.apple.com/${shareMatch[1]}`;

  if (BARE_PLAYLIST_ID_RE.test(trimmed)) return buildPlaylistEmbedUrl(trimmed);

  return null;
}
