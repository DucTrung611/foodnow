import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { DeliveryTrackingSnapshot } from '../types/delivery.types';
import { DeliveryTrackingMap } from './DeliveryTrackingMap';

// Presentational component — smoke-tested only, per PROJECT-RULES-FRONTEND.md §8.
describe('DeliveryTrackingMap', () => {
  it('shows a fallback state when no snapshot has arrived yet', () => {
    render(<DeliveryTrackingMap snapshot={undefined} />);
    expect(screen.getByText('Chưa có vị trí tài xế')).toBeInTheDocument();
  });

  it('renders a live map once a snapshot is available', () => {
    const snapshot: DeliveryTrackingSnapshot = {
      lat: 21.0245,
      lng: 105.8412,
      recordedAt: '2026-08-24T10:30:00.000Z',
      etaMinutes: 8,
    };
    const { container } = render(<DeliveryTrackingMap snapshot={snapshot} />);
    expect(container.querySelector('.leaflet-container')).toBeInTheDocument();
  });
});
