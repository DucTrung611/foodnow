export type ToastVariant = 'success' | 'error' | 'info';

type ToastProps = {
  variant: ToastVariant;
  message: string;
  onDismiss: () => void;
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: 'bg-success text-paper',
  error: 'bg-danger text-paper',
  info: 'bg-ink text-paper',
};

export function Toast({ variant, message, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      className={`flex items-center gap-3 rounded-ticket px-4 py-3 font-sans text-body-sm shadow-float ${VARIANT_CLASSES[variant]}`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Đóng thông báo"
        className="-mr-2.5 flex size-11 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/70"
      >
        <svg className="size-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
