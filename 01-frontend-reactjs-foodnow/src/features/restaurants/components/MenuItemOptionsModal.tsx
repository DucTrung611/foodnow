import { useState } from 'react';
import { Badge, Button, Modal } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import type { MenuItem } from '../types/restaurants.types';
import { calculateMenuItemUnitPrice, isOptionGroupSatisfied } from '../utils/menu-item-price';

type MenuItemOptionsModalProps = {
  item: MenuItem;
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: { optionIds: string[]; quantity: number }) => void;
};

export function MenuItemOptionsModal({ item, open, isSubmitting, onClose, onConfirm }: MenuItemOptionsModalProps) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  const toggleOption = (groupId: string, optionId: string, maxSelect: number) => {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (maxSelect === 1) return { ...prev, [groupId]: [optionId] };
      if (current.includes(optionId)) return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      if (current.length >= maxSelect) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const selectedOptionIds = Object.values(selections).flat();
  const allGroupsSatisfied = item.optionGroups.every((group) =>
    isOptionGroupSatisfied(group.minSelect, (selections[group.id] ?? []).length),
  );
  const unitPrice = calculateMenuItemUnitPrice(item, selectedOptionIds);

  const handleClose = () => {
    setSelections({});
    setQuantity(1);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={item.name}>
      <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto pr-1">
        {item.optionGroups.map((group) => (
          <fieldset key={group.id}>
            <legend className="mb-2 flex items-center gap-2">
              <span className="font-display text-sm font-bold text-ink">{group.name}</span>
              {group.minSelect > 0 && <Badge variant="accent">Bắt buộc</Badge>}
              {group.maxSelect > 1 && <span className="text-xs text-muted">chọn tối đa {group.maxSelect}</span>}
            </legend>
            <div className="flex flex-col gap-1.5">
              {group.options.map((option) => {
                const checked = (selections[group.id] ?? []).includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center justify-between rounded-ticket border px-3 py-2 text-sm transition-colors ${
                      checked ? 'border-primary bg-primary-bg' : 'border-muted-border'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-ink">
                      <input
                        type={group.maxSelect === 1 ? 'radio' : 'checkbox'}
                        name={group.id}
                        checked={checked}
                        onChange={() => toggleOption(group.id, option.id, group.maxSelect)}
                        className="accent-primary"
                      />
                      {option.name}
                    </span>
                    {Number(option.extraPrice) > 0 && (
                      <span className="font-mono text-xs text-ink">+{formatMoney(option.extraPrice)}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="flex items-center justify-between border-t border-muted-border pt-4">
          <span className="text-sm font-medium text-ink">Số lượng</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="size-7 rounded-ticket border border-muted-border text-ink hover:bg-primary-bg"
              aria-label="Giảm số lượng"
            >
              −
            </button>
            <span className="w-5 text-center font-mono text-sm text-ink">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="size-7 rounded-ticket border border-muted-border text-ink hover:bg-primary-bg"
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="font-mono text-sm text-muted">Tổng</span>
        <span className="font-mono text-lg font-bold text-ink">{formatMoney(unitPrice * quantity)}</span>
      </div>

      <Button
        onClick={() => onConfirm({ optionIds: selectedOptionIds, quantity })}
        disabled={!allGroupsSatisfied}
        isLoading={isSubmitting}
        className="mt-4 w-full"
      >
        Thêm vào giỏ
      </Button>
    </Modal>
  );
}
