import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  variant: ToastVariant;
  message: string;
};

type NotificationState = {
  toasts: Toast[];
  showToast: (variant: ToastVariant, message: string) => void;
  dismissToast: (id: string) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  showToast: (variant, message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), variant, message }],
    })),
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
