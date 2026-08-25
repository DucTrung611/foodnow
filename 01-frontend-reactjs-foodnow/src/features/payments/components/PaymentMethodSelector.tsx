import type { PaymentMethod } from '../types/payments.types';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'CARD', label: 'Thẻ ngân hàng' },
  { value: 'WALLET', label: 'Ví điện tử' },
];

type PaymentMethodSelectorProps = {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
};

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {METHODS.map((method) => (
        <label
          key={method.value}
          className={`flex cursor-pointer items-center gap-3 rounded-ticket border p-3 ${
            value === method.value ? 'border-primary' : 'border-muted-border'
          }`}
        >
          <input type="radio" name="payment-method" checked={value === method.value} onChange={() => onChange(method.value)} />
          <span className="text-sm text-ink">{method.label}</span>
        </label>
      ))}
    </div>
  );
}
