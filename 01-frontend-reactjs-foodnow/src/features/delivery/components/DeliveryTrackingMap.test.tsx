import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { DeliveryTrackingSnapshot } from '../types/delivery.types';
import { DeliveryTrackingMap } from './DeliveryTrackingMap';

// Presentational component — smoke-tested only, per PROJECT-RULES-FRONTEND.md §8.
describe('DeliveryTrackingMap', () => {
  it('shows a waiting placeholder when no snapshot has arrived yet', () => {
    render(<DeliveryTrackingMap snapshot={undefined} />);
    expect(screen.getByText('Đang chờ vị trí tài xế...')).toBeInTheDocument();
  });

  it('renders the latest coordinates and ETA once a snapshot is available', () => {
    const snapshot: DeliveryTrackingSnapshot = {
      lat: 21.0245,
      lng: 105.8412,
      recordedAt: '2026-08-24T10:30:00.000Z',
      etaMinutes: 8,
    };
    render(<DeliveryTrackingMap snapshot={snapshot} />);

    expect(screen.getByText('21.02450, 105.84120')).toBeInTheDocument();
    expect(screen.getByText('Còn khoảng 8 phút')).toBeInTheDocument();
  });
});
