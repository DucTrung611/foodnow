import { formatDateTime } from '@/shared/utils/date';
import type { Review } from '../types/reviews.types';

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border-b border-muted-border py-3 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-accent">{'★'.repeat(review.rating)}</span>
        <span className="text-xs text-muted">{formatDateTime(review.createdAt)}</span>
      </div>
      {review.comment && <p className="mt-1 text-sm text-ink">{review.comment}</p>}
    </div>
  );
}
