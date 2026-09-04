import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'accent' | 'success' | 'danger' | 'neutral';

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: 'bg-primary-bg text-primary-hover',
  accent: 'bg-accent-bg text-accent',
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
  neutral: 'bg-muted-border text-muted',
};

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    // Body face, not monospace — a badge is a label, not an identifier (G4).
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-caption ${VARIANT_CLASSES[variant]}`}>
      {children}
    </span>
  );
}
