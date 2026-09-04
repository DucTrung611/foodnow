import { Card } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';

export function CardSection() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-display-md text-ink">Card</h2>

      <div className="grid max-w-sm gap-4">
        <Card>
          <p className="text-body-lg font-medium text-ink">Phở bò tái</p>
          <p className="text-body-sm text-muted">Bánh phở, thịt bò tái, hành lá</p>
        </Card>

        <Card variant="ticket">
          <div className="flex justify-between text-body-sm text-ink">
            <span>Tạm tính</span>
            <span>{formatMoney(85000)}</span>
          </div>
          <div className="flex justify-between text-body-sm text-ink">
            <span>Phí giao hàng</span>
            <span>{formatMoney(15000)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-muted-border pt-2 text-body-lg font-medium text-ink">
            <span>Tổng cộng</span>
            <span>{formatMoney(100000)}</span>
          </div>
        </Card>
      </div>
    </section>
  );
}
