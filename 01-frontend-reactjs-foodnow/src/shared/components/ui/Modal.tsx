import { useEffect, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      {/* Mouse-only backdrop dismiss — not a tab stop; the labeled close
          button below and Escape cover keyboard/AT users. */}
      <div aria-hidden className="absolute inset-0 cursor-default" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-card bg-paper p-6 shadow-float">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-muted-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        {title && <h2 className="mb-4 pr-8 font-display text-display-md text-ink">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
