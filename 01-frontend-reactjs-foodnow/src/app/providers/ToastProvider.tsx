import type { ReactNode } from 'react';
import { useNotificationStore } from '@/shared/stores/notification.store';

const VARIANT_CLASSES = {
  success: 'bg-success text-paper',
  error: 'bg-danger text-paper',
  info: 'bg-ink text-paper',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const toasts = useNotificationStore((s) => s.toasts);
  const dismissToast = useNotificationStore((s) => s.dismissToast);

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`flex items-center gap-3 rounded-ticket px-4 py-3 font-sans text-sm shadow-lg ${VARIANT_CLASSES[toast.variant]}`}
          >
            <span>{toast.message}</span>
            <button type="button" onClick={() => dismissToast(toast.id)} className="opacity-70 hover:opacity-100" aria-label="Đóng thông báo">
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
