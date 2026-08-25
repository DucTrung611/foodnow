import type { ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <button type="button" aria-label="Đóng" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-ticket bg-paper p-6 shadow-xl">
        {title && <h2 className="mb-4 font-display text-lg font-bold text-ink">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
