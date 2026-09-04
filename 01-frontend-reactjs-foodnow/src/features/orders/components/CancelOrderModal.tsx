import { useState } from 'react';
import { Button, Modal } from '@/shared/components/ui';
import { useCancelOrder } from '../hooks/useCancelOrder';

type CancelOrderModalProps = {
  orderId: string;
  open: boolean;
  onClose: () => void;
};

export function CancelOrderModal({ orderId, open, onClose }: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const cancelOrder = useCancelOrder(orderId);

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Hủy đơn hàng">
      <p className="text-body-sm text-muted">Vui lòng cho biết lý do hủy đơn. Thao tác này không thể hoàn tác.</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="VD: Đặt nhầm món, muốn đổi địa chỉ..."
        rows={3}
        className="mt-3 w-full resize-none rounded-ticket border border-muted-border px-3.5 py-2.5 font-sans text-body text-ink outline-none transition-colors placeholder:text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50"
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          Đóng
        </Button>
        <Button
          variant="danger"
          isLoading={cancelOrder.isPending}
          disabled={!reason.trim()}
          onClick={() => cancelOrder.mutate(reason, { onSuccess: handleClose })}
        >
          Xác nhận hủy
        </Button>
      </div>
    </Modal>
  );
}
