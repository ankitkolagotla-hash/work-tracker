export type ThemeId = 'obsidian-slate' | 'pure-oled' | 'midnight-navy' | 'cyberpunk-void' | 'nord-frosted' | 'forest-emerald';
export type AccentId = 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';

export interface ThemeTokens {
  /** All token values are "R G B" space-separated triplets for use with rgb(var(--x) / <alpha-value>). */
  bg: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
}

export interface ThemePreset {
  id: ThemeId;
  name: string;
  description: string;
  swatch: string;
  tokens: ThemeTokens;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'obsidian-slate',
    name: 'Obsidian Slate',
    description: 'Deep slate & onyx default',
    swatch: '#0D0F12',
    tokens: { bg: '13 15 18', card: '22 26 34', border: '35 41 54', text: '241 245 249', textMuted: '148 163 184' },
  },
  {
    id: 'pure-oled',
    name: 'Pure OLED Pitch',
    description: 'True black background, pitch cards',
    swatch: '#000000',
    tokens: { bg: '0 0 0', card: '12 12 12', border: '32 32 32', text: '245 245 245', textMuted: '150 150 150' },
  },
  {
    id: 'midnight-navy',
    name: 'Midnight Navy',
    description: 'Deep sapphire base, cool steel borders',
    swatch: '#0B0F19',
    tokens: { bg: '11 15 25', card: '17 24 39', border: '30 41 59', text: '226 232 240', textMuted: '148 163 184' },
  },
  {
    id: 'cyberpunk-void',
    name: 'Cyberpunk Void',
    description: 'Deep twilight purple, neon accents',
    swatch: '#0D0814',
    tokens: { bg: '13 8 20', card: '24 15 36', border: '58 34 87', text: '237 233 254', textMuted: '168 143 196' },
  },
  {
    id: 'nord-frosted',
    name: 'Nord Frosted',
    description: 'Cool slate-blue, frosted glass feel',
    swatch: '#2E3440',
    tokens: { bg: '46 52 64', card: '59 66 82', border: '76 86 106', text: '236 239 244', textMuted: '216 222 233' },
  },
  {
    id: 'forest-emerald',
    name: 'Forest Emerald',
    description: 'Deep forest green, quiet focus',
    swatch: '#0B1410',
    tokens: { bg: '11 20 16', card: '20 32 25', border: '36 53 44', text: '229 243 234', textMuted: '156 184 168' },
  },
];

export interface AccentPreset {
  id: AccentId;
  name: string;
  hex: string;
  /** "R G B" space-separated triplet for use with rgb(var(--cf-accent) / <alpha-value>). */
  rgb: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'cyan', name: 'Electric Cyan', hex: '#38BDF8', rgb: '56 189 248' },
  { id: 'emerald', name: 'Emerald Jade', hex: '#10B981', rgb: '16 185 129' },
  { id: 'amber', name: 'Sunset Amber', hex: '#F59E0B', rgb: '245 158 11' },
  { id: 'rose', name: 'Rose / Crimson', hex: '#F43F5E', rgb: '244 63 94' },
  { id: 'violet', name: 'Violet / Iris', hex: '#8B5CF6', rgb: '139 92 246' },
];

export const DEFAULT_THEME: ThemeId = 'obsidian-slate';
export const DEFAULT_ACCENT: AccentId = 'cyan';

export function getThemePreset(id: ThemeId): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0];
}

export function getAccentPreset(id: AccentId): AccentPreset {
  return ACCENT_PRESETS.find((a) => a.id === id) ?? ACCENT_PRESETS[0];
}
