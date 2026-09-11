import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeId, AccentId, DEFAULT_THEME, DEFAULT_ACCENT } from '../lib/theme';

interface ThemeState {
  themeId: ThemeId;
  accentId: AccentId;
  setTheme: (id: ThemeId) => void;
  setAccent: (id: AccentId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME,
      accentId: DEFAULT_ACCENT,
      setTheme: (id) => set({ themeId: id }),
      setAccent: (id) => set({ accentId: id }),
    }),
    {
      name: 'chronoflow-theme',
    }
  )
);
