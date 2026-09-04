import { useState } from 'react';
import { Button, Modal } from '@/shared/components/ui';
import { useNotificationStore } from '@/shared/stores/notification.store';

export function OverlaySection() {
  const [open, setOpen] = useState(false);
  const showToast = useNotificationStore((s) => s.showToast);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-display-md text-ink">Modal &amp; Toast</h2>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Mở modal
        </Button>
        <Button variant="primary" onClick={() => showToast('success', 'Đặt hàng thành công')}>
          Toast thành công
        </Button>
        <Button variant="danger" onClick={() => showToast('error', 'Thanh toán bị từ chối')}>
          Toast lỗi
        </Button>
        <Button variant="ghost" onClick={() => showToast('info', 'Đơn hàng đang được chuẩn bị')}>
          Toast thông tin
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Xác nhận hủy đơn">
        <p className="text-body text-ink">
          Bạn có chắc muốn hủy đơn FN-260828-1465 không? Thao tác này không thể hoàn tác.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Đóng
          </Button>
          <Button variant="danger" onClick={() => setOpen(false)}>
            Hủy đơn
          </Button>
        </div>
      </Modal>
    </section>
  );
}
