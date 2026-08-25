import { useState } from 'react';
import { Button } from '@/shared/components/ui';
import { useCreateReview } from '../hooks/useCreateReview';

type ReviewFormProps = {
  orderId: string;
  onSubmitted?: () => void;
};

export function ReviewForm({ orderId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const createReview = useCreateReview(orderId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            aria-label={`${star} sao`}
            className={`text-2xl ${star <= rating ? 'text-accent' : 'text-muted-border'}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Chia sẻ trải nghiệm của bạn..."
        rows={3}
        className="rounded-ticket border border-muted-border px-3.5 py-2.5 font-sans text-sm outline-none focus:border-primary"
      />
      <Button
        isLoading={createReview.isPending}
        onClick={() => createReview.mutate({ rating, comment: comment || undefined }, { onSuccess: onSubmitted })}
      >
        Gửi đánh giá
      </Button>
    </div>
  );
}
