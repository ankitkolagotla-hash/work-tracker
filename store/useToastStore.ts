import { create } from 'zustand';

export interface ToastItem {
  id: string;
  message: string;
  /** The assessment this toast's Undo action reverts, if any. */
  assessmentId: string | null;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, assessmentId?: string | null) => void;
  removeToast: (id: string) => void;
}

/** Ephemeral, non-persisted toast queue for brief confirmations like "marked done" + Undo. */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, assessmentId = null) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, assessmentId }] }));
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
