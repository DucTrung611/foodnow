import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes/routes.config';
import { RegisterForm } from '../components/RegisterForm';

export function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm rounded-ticket border border-muted-border bg-paper p-8 shadow-sm">
        <span className="font-mono text-xs uppercase tracking-wider text-primary">Đăng ký</span>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink">Tạo tài khoản FoodNow</h1>

        <div className="mt-6">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Đã có tài khoản?{' '}
          <Link to={ROUTES.login} className="font-medium text-primary">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
