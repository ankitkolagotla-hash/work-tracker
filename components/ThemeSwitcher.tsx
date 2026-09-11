'use client';
import React, { useState } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { THEME_PRESETS, ACCENT_PRESETS } from '../lib/theme';
import { Palette, Check } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { themeId, accentId, setTheme, setAccent } = useThemeStore();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 bg-cf-card border border-cf-border hover:border-slate-600 rounded-lg text-xs font-semibold tracking-wider text-cf-text-muted transition"
      >
        <Palette className="w-3.5 h-3.5 text-cf-accent" /> Theme
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-cf-card border border-cf-border rounded-xl p-4 shadow-2xl z-50">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cf-text-muted mb-2">Depth of Darkness</h4>
            <div className="space-y-1.5 mb-4">
              {THEME_PRESETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition ${
                    themeId === t.id ? 'border-cf-accent bg-cf-accent/10' : 'border-cf-border hover:border-slate-600'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full border border-cf-border shrink-0" style={{ backgroundColor: t.swatch }} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-cf-text">{t.name}</span>
                    <span className="block text-[10px] text-cf-text-muted truncate">{t.description}</span>
                  </span>
                  {themeId === t.id && <Check className="w-3.5 h-3.5 text-cf-accent shrink-0" />}
                </button>
              ))}
            </div>

            <h4 className="text-xs font-semibold uppercase tracking-wider text-cf-text-muted mb-2">Accent Color</h4>
            <div className="flex items-center gap-2">
              {ACCENT_PRESETS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccent(a.id)}
                  title={a.name}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
                    accentId === a.id ? 'border-cf-text' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: a.hex }}
                >
                  {accentId === a.id && <Check className="w-4 h-4 text-black" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
