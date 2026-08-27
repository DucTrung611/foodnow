/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { OrderResponseDto } from '../../orders/dto/order-response.dto';
import { OrdersService } from '../../orders/orders.service';
import { EarningsListener } from '../earnings.listener';
import { EarningsService } from '../earnings.service';

const ORDER = { id: 'order-1', deliveryFee: '18000.00' } as OrderResponseDto;

describe('EarningsListener', () => {
  let listener: EarningsListener;
  let earningsService: jest.Mocked<EarningsService>;
  let ordersService: jest.Mocked<OrdersService>;

  beforeEach(() => {
    earningsService = {
      recordEarning: jest.fn(),
    } as unknown as jest.Mocked<EarningsService>;
    ordersService = {
      getOrderUnchecked: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;

    listener = new EarningsListener(earningsService, ordersService);
  });

  it('records the delivery fee as a PENDING earning for the driver', async () => {
    ordersService.getOrderUnchecked.mockResolvedValue(ORDER);

    await listener.handleDeliveryCompleted({
      deliveryId: 'delivery-1',
      driverId: 'driver-1',
      orderId: 'order-1',
    });

    expect(ordersService.getOrderUnchecked).toHaveBeenCalledWith('order-1');
    expect(earningsService.recordEarning).toHaveBeenCalledWith(
      'driver-1',
      'delivery-1',
      18000,
    );
  });

  it('swallows errors — a failed credit must never break delivery completion', async () => {
    ordersService.getOrderUnchecked.mockRejectedValue(
      new Error('order lookup failed'),
    );

    await expect(
      listener.handleDeliveryCompleted({
        deliveryId: 'delivery-1',
        driverId: 'driver-1',
        orderId: 'order-1',
      }),
    ).resolves.toBeUndefined();
    expect(earningsService.recordEarning).not.toHaveBeenCalled();
  });
});
