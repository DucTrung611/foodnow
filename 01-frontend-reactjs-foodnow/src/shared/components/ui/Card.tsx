import type { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'default' | 'ticket';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** `ticket` is reserved for receipt-like content (checkout summary, order
   * totals) — a dashed divider signals "this is a receipt", it isn't the
   * default card treatment (design brief: don't apply one look to every kind
   * of content). */
  variant?: CardVariant;
  children: ReactNode;
};

export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-muted-border bg-paper p-4 ${
        variant === 'ticket' ? 'border-dashed' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
