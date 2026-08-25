import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Input } from '@/shared/components/ui';
import { useRegister } from '../hooks/useAuth';

// Mirrors backend RegisterDto validation (features/users/dto/register.dto.ts).
const registerSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  phone: z.string().regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  role: z.enum(['CUSTOMER', 'VENDOR', 'DRIVER']),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const registerAccount = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CUSTOMER' },
  });

  return (
    <form onSubmit={handleSubmit((values) => registerAccount.mutate(values))} className="flex flex-col gap-4">
      <Input label="Họ tên" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input label="Số điện thoại" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
      <Input
        label="Mật khẩu"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-sm font-medium text-ink">
          Bạn đăng ký với vai trò
        </label>
        <select
          id="role"
          className="rounded-ticket border border-muted-border px-3.5 py-2.5 font-sans text-sm text-ink outline-none focus:border-primary"
          {...register('role')}
        >
          <option value="CUSTOMER">Khách hàng</option>
          <option value="VENDOR">Nhà hàng</option>
          <option value="DRIVER">Tài xế</option>
        </select>
      </div>

      <Button type="submit" isLoading={registerAccount.isPending} className="mt-2 w-full">
        Tạo tài khoản
      </Button>
    </form>
  );
}
