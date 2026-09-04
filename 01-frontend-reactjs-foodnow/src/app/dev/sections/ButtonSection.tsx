import { Button } from '@/shared/components/ui';

const VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

export function ButtonSection() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-display-md text-ink">Button</h2>

      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-3">
          <span className="w-10 text-caption text-muted">{size}</span>
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} size={size}>
              Đặt hàng
            </Button>
          ))}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <span className="w-10 text-caption text-muted">state</span>
        <Button isLoading>Đang xử lý</Button>
        <Button disabled>Vô hiệu hoá</Button>
      </div>

      <p className="text-body-sm text-muted">
        Tab qua các nút để xem viền focus — mọi nút cao tối thiểu 44px.
      </p>
    </section>
  );
}
