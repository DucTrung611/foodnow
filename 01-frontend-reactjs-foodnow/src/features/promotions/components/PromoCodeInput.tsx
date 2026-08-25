import { useState } from 'react';
import { Button } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { useValidatePromotion } from '../hooks/useValidatePromotion';

type PromoCodeInputProps = {
  restaurantId: string;
  subtotal: string;
  onApplied: (code: string, discountAmount: string) => void;
};

export function PromoCodeInput({ restaurantId, subtotal, onApplied }: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const validate = useValidatePromotion();

  const handleApply = () => {
    if (!code) return;
    validate.mutate(
      { code, restaurantId, subtotal },
      { onSuccess: (result) => onApplied(result.code, result.discountAmount) },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Mã khuyến mãi"
          className="flex-1 rounded-ticket border border-muted-border px-3.5 py-2.5 font-mono text-sm outline-none focus:border-primary"
        />
        <Button variant="ghost" onClick={handleApply} isLoading={validate.isPending}>
          Áp dụng
        </Button>
      </div>
      {validate.data && (
        <p className="text-xs text-success">Giảm {formatMoney(validate.data.discountAmount)}</p>
      )}
    </div>
  );
}
