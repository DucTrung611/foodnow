const SWATCHES: { name: string; className: string }[] = [
  { name: 'ink', className: 'bg-ink' },
  { name: 'paper', className: 'bg-paper border border-muted-border' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'primary-hover', className: 'bg-primary-hover' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'success', className: 'bg-success' },
  { name: 'danger', className: 'bg-danger' },
  { name: 'muted', className: 'bg-muted' },
];

const STATUS_SWATCHES: { name: string; className: string }[] = [
  { name: 'status-pending', className: 'bg-status-pending' },
  { name: 'status-confirmed', className: 'bg-status-confirmed' },
  { name: 'status-preparing', className: 'bg-status-preparing' },
  { name: 'status-ready', className: 'bg-status-ready' },
  { name: 'status-enroute', className: 'bg-status-enroute' },
  { name: 'status-delivered', className: 'bg-status-delivered' },
  { name: 'status-cancelled', className: 'bg-status-cancelled' },
];

const DIACRITIC_SAMPLE = 'Chả cá Lã Vọng – nước mắm ớt, rau thơm, bánh đa nem giòn rụm';

export function ColorTypeSection() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-display-md text-ink">Màu sắc &amp; Chữ</h2>

      <div>
        <p className="mb-2 text-body-sm text-muted">Bảng màu chính</p>
        <div className="flex flex-wrap gap-3">
          {SWATCHES.map((s) => (
            <div key={s.name} className="flex flex-col items-center gap-1.5">
              <div className={`size-14 rounded-card ${s.className}`} />
              <span className="text-caption text-muted">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-body-sm text-muted">7 trạng thái đơn hàng</p>
        <div className="flex flex-wrap gap-3">
          {STATUS_SWATCHES.map((s) => (
            <div key={s.name} className="flex flex-col items-center gap-1.5">
              <div className={`size-14 rounded-card ${s.className}`} />
              <span className="text-caption text-muted">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-muted-border p-4">
        <p className="text-body-sm text-muted">
          Thang chữ — Be Vietnam Pro (mẫu có dấu để kiểm tra khoảng dòng)
        </p>
        <p className="font-display text-display-lg text-ink">{DIACRITIC_SAMPLE}</p>
        <p className="font-display text-display-md text-ink">{DIACRITIC_SAMPLE}</p>
        <p className="text-body-lg text-ink">{DIACRITIC_SAMPLE}</p>
        <p className="text-body text-ink">{DIACRITIC_SAMPLE}</p>
        <p className="text-body-sm text-ink">{DIACRITIC_SAMPLE}</p>
        <p className="text-caption text-ink">{DIACRITIC_SAMPLE}</p>
        <p className="font-mono text-mono-code text-ink">FN-260828-1465</p>
      </div>
    </section>
  );
}
