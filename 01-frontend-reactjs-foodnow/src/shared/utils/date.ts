/**
 * API timestamps are ISO 8601 UTC strings (API_SPEC.md §1).
 *
 * Explicit field options (not the `dateStyle`/`timeStyle` shorthand) because
 * vi-VN's short date style renders a 2-digit year ("24/8/26"), which is
 * ambiguous (UX-AUDIT-REPORT.md G7).
 */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return formatDateTime(iso);
}
