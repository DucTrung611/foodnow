import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AvailableDelivery } from '../types/delivery.types';
import { DriverOfferCard } from './DriverOfferCard';

const OFFER: AvailableDelivery = {
  orderId: '8f14e45f-abcd-1234-5678-90abcdef1234',
  restaurantId: 'restaurant-1',
  distanceMeters: 850,
  estimatedEarning: '25000.00',
};

// Presentational component — smoke-tested only, per PROJECT-RULES-FRONTEND.md §8.
describe('DriverOfferCard', () => {
  it('renders the formatted distance, earning, and short order id', () => {
    render(<DriverOfferCard offer={OFFER} onAccept={vi.fn()} />);

    expect(screen.getByText(/850 m/)).toBeInTheDocument();
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();
    expect(screen.getByText('Đơn #8f14e45f')).toBeInTheDocument();
  });

  it('calls onAccept when "Nhận đơn" is clicked', async () => {
    const onAccept = vi.fn();
    render(<DriverOfferCard offer={OFFER} onAccept={onAccept} />);

    await userEvent.click(screen.getByRole('button', { name: 'Nhận đơn' }));
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it('disables the button while isAccepting', () => {
    render(<DriverOfferCard offer={OFFER} onAccept={vi.fn()} isAccepting />);
    expect(screen.getByRole('button', { name: 'Nhận đơn' })).toBeDisabled();
  });
});
