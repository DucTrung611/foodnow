import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatDateTime } from '@/shared/utils/date';
import type { Review } from '../types/reviews.types';
import { ReviewCard } from './ReviewCard';

const REVIEW: Review = {
  id: 'review-1',
  orderId: 'order-1',
  customerId: 'customer-1',
  restaurantId: 'restaurant-1',
  driverId: 'driver-1',
  rating: 4,
  comment: 'Đồ ăn ngon, giao nhanh',
  createdAt: '2026-08-24T10:30:00.000Z',
};

// Presentational component — smoke-tested only, per PROJECT-RULES-FRONTEND.md §8.
describe('ReviewCard', () => {
  it('renders the star rating, formatted date, and comment', () => {
    render(<ReviewCard review={REVIEW} />);

    expect(screen.getByText('★★★★')).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(REVIEW.createdAt))).toBeInTheDocument();
    expect(screen.getByText('Đồ ăn ngon, giao nhanh')).toBeInTheDocument();
  });

  it('omits the comment paragraph when there is no comment', () => {
    render(<ReviewCard review={{ ...REVIEW, comment: null }} />);
    expect(screen.queryByText('Đồ ăn ngon, giao nhanh')).not.toBeInTheDocument();
  });
});
