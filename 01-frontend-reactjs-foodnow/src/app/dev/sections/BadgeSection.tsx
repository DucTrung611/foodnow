import { Badge, StatusBadge, type StatusTone } from '@/shared/components/ui';

const BADGE_VARIANTS = ['primary', 'accent', 'success', 'danger', 'neutral'] as const;

const STATUS_ITEMS: { tone: StatusTone; label: string }[] = [
  { tone: 'pending', label: 'Chờ xác nhận' },
  { tone: 'confirmed', label: 'Đã xác nhận' },
  { tone: 'preparing', label: 'Đang chuẩn bị' },
  { tone: 'ready', label: 'Chờ tài xế lấy' },
  { tone: 'enroute', label: 'Đang giao' },
  { tone: 'delivered', label: 'Đã giao' },
  { tone: 'cancelled', label: 'Đã hủy' },
];

export function BadgeSection() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-display-md text-ink">Badge &amp; StatusBadge</h2>

      <div className="flex flex-wrap gap-2">
        {BADGE_VARIANTS.map((v) => (
          <Badge key={v} variant={v}>
            {v}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_ITEMS.map((item) => (
          <StatusBadge key={item.tone} tone={item.tone} label={item.label} />
        ))}
      </div>
    </section>
  );
}
