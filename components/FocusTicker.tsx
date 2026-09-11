'use client';
import { useEffect } from 'react';
import { useFocusStore } from '../store/useFocusStore';

/**
 * Headless component that keeps the sprint countdown ticking regardless of which
 * view is on screen (dashboard or the mastery workspace). Mounted once in the
 * root layout so a sprint survives navigation.
 */
export const FocusTicker: React.FC = () => {
  const phase = useFocusStore((s) => s.phase);
  const tickSprint = useFocusStore((s) => s.tickSprint);

  useEffect(() => {
    if (phase !== 'work' && phase !== 'break') return;
    const interval = setInterval(() => tickSprint(), 1000);
    return () => clearInterval(interval);
  }, [phase, tickSprint]);

  return null;
};
