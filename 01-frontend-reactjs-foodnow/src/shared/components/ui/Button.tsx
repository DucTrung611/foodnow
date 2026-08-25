import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-paper hover:bg-primary-hover',
  secondary: 'bg-ink text-paper hover:bg-ink/90',
  ghost: 'bg-transparent text-ink border border-muted-border hover:bg-primary-bg',
  danger: 'bg-danger text-paper hover:bg-danger/90',
};

export function Button({ variant = 'primary', isLoading, disabled, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-ticket px-4 py-2.5 font-sans font-medium text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      )}
      {children}
    </button>
  );
}
