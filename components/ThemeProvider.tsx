'use client';
import React, { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { getThemePreset, getAccentPreset } from '../lib/theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeId = useThemeStore((s) => s.themeId);
  const accentId = useThemeStore((s) => s.accentId);

  useEffect(() => {
    const theme = getThemePreset(themeId);
    const accent = getAccentPreset(accentId);
    const root = document.documentElement.style;
    root.setProperty('--cf-bg', theme.tokens.bg);
    root.setProperty('--cf-card', theme.tokens.card);
    root.setProperty('--cf-border', theme.tokens.border);
    root.setProperty('--cf-text', theme.tokens.text);
    root.setProperty('--cf-text-muted', theme.tokens.textMuted);
    root.setProperty('--cf-accent', accent.rgb);
  }, [themeId, accentId]);

  return <>{children}</>;
};
