import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui';
import { ROUTES } from '@/app/routes/routes.config';

const TICKET_STEPS = [
  { code: 'PENDING', label: 'Đã đặt' },
  { code: 'PREPARING', label: 'Đang nấu' },
  { code: 'ON_THE_WAY', label: 'Đang giao' },
  { code: 'DELIVERED', label: 'Đã giao' },
] as const;

export function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">Giao đồ ăn · Theo dõi trực tiếp</span>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
            Từ bếp đến cửa nhà bạn, <span className="text-primary">từng bước một</span>.
          </h1>
          <p className="mt-4 text-base text-muted">
            Đặt món từ hàng ngàn nhà hàng quanh bạn, theo dõi đơn hàng theo thời gian thực — như dõi một chiếc vé bếp, từ lúc gọi món đến khi tài xế gõ cửa.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to={ROUTES.restaurants}>
              <Button>Khám phá nhà hàng</Button>
            </Link>
            <Link to={ROUTES.register}>
              <Button variant="ghost">Tạo tài khoản</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-ticket border border-muted-border bg-ink p-6 text-paper shadow-xl">
          <div className="flex items-center justify-between font-mono text-xs text-paper/60">
            <span>FN-240824-0042</span>
            <span>10:30</span>
          </div>
          <p className="mt-3 font-display text-lg font-bold">Trà sữa trân châu × 2</p>
          <ol className="mt-6 flex items-center justify-between">
            {TICKET_STEPS.map((step, i) => (
              <li key={step.code} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`size-2.5 rounded-full ${i <= 1 ? 'bg-primary' : 'bg-paper/25'}`} />
                  <span className="font-mono text-[10px] text-paper/70">{step.label}</span>
                </div>
                {i < TICKET_STEPS.length - 1 && <span className="mx-1 h-px flex-1 bg-paper/25" />}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
