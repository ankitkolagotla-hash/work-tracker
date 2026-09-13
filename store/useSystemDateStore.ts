import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BASELINE_DATE_STR, addDays } from '../lib/date';

function realTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SystemDateState {
  /** Manual pin (YYYY-MM-DD). When set, this wins over auto-advance. */
  overrideDate: string | null;
  /** When true (and no override), the system date tracks the real calendar date. */
  autoAdvance: boolean;

  setOverrideDate: (date: string | null) => void;
  setAutoAdvance: (v: boolean) => void;
  advanceOneDay: () => void;
  resetToBaseline: () => void;
}

/** Pure resolver so both the store and any plain (non-hook) call site agree on "today". */
export function resolveSystemDate(state: Pick<SystemDateState, 'overrideDate' | 'autoAdvance'>): string {
  if (state.overrideDate) return state.overrideDate;
  if (state.autoAdvance) {
    const real = realTodayStr();
    // Never regress before the install baseline, even if the device clock is off.
    return real > BASELINE_DATE_STR ? real : BASELINE_DATE_STR;
  }
  return BASELINE_DATE_STR;
}

export const useSystemDateStore = create<SystemDateState>()(
  persist(
    (set, get) => ({
      overrideDate: null,
      autoAdvance: true,

      setOverrideDate: (date) => set({ overrideDate: date }),
      setAutoAdvance: (v) => set({ autoAdvance: v, overrideDate: v ? null : get().overrideDate }),
      advanceOneDay: () => {
        const current = resolveSystemDate(get());
        set({ overrideDate: addDays(current, 1), autoAdvance: false });
      },
      resetToBaseline: () => set({ overrideDate: null, autoAdvance: false }),
    }),
    { name: 'chronoflow-system-date' }
  )
);

/** React hook returning the live, reactive "today" string used across dashboards. */
export function useSystemDate(): string {
  return useSystemDateStore((s) => resolveSystemDate(s));
}
