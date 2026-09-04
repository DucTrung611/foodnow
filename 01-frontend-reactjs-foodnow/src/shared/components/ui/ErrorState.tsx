import { Button } from './Button';

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  description = 'Vui lòng thử lại sau.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <svg className="size-10 text-danger" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3l10 18H2L12 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M12 10v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="17" r="0.75" fill="currentColor" />
      </svg>
      <p className="text-body-lg font-medium text-ink">{title}</p>
      <p className="max-w-xs text-body-sm text-muted">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
