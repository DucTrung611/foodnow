import { useState } from 'react';
import { Input, Select } from '@/shared/components/ui';

export function FormSection() {
  const [value, setValue] = useState('');

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-display-md text-ink">Input &amp; Select</h2>

      <div className="grid max-w-sm gap-4">
        <Input
          label="Tên nhà hàng"
          placeholder="VD: Phở Thìn Bờ Hồ"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Input label="Số điện thoại" placeholder="09xx xxx xxx" error="Số điện thoại không hợp lệ" />
        <Input label="Đã vô hiệu hoá" placeholder="Không thể chỉnh sửa" disabled />
        <Select label="Vai trò" defaultValue="">
          <option value="" disabled>
            Chọn vai trò
          </option>
          <option value="CUSTOMER">Khách hàng</option>
          <option value="VENDOR">Nhà hàng</option>
          <option value="DRIVER">Tài xế</option>
        </Select>
        <Select label="Có lỗi" error="Vui lòng chọn một mục" defaultValue="">
          <option value="" disabled>
            Chọn một mục
          </option>
          <option value="a">Lựa chọn A</option>
        </Select>
      </div>
    </section>
  );
}
