import { useState } from 'react';
import { Button } from '@/shared/components/ui';
import { usePayOrder } from '../hooks/usePayOrder';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import type { PaymentMethod } from '../types/payments.types';

type PayOrderPanelProps = {
  orderId: string;
};

export function PayOrderPanel({ orderId }: PayOrderPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const payOrder = usePayOrder(orderId);

  return (
    <div className="rounded-ticket border border-muted-border p-4">
      <h2 className="font-display text-base font-bold text-ink">Thanh toán</h2>
      <div className="mt-3">
        <PaymentMethodSelector value={method} onChange={setMethod} />
      </div>
      <Button onClick={() => payOrder.mutate({ method })} isLoading={payOrder.isPending} className="mt-4 w-full">
        Xác nhận thanh toán
      </Button>
    </div>
  );
}
