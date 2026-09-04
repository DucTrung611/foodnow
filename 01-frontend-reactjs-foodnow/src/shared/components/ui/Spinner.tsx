type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  /** Only set this for a standalone/full-page spinner that isn't already
   * inside a labeled control — an inline spinner next to button text would
   * otherwise get announced twice. */
  label?: string;
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'size-3.5 border-2',
  md: 'size-5 border-2',
  lg: 'size-8 border-[3px]',
};

export function Spinner({ size = 'md', label, className = '' }: SpinnerProps) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${SIZE_CLASSES[size]} ${className}`}
    />
  );
}
