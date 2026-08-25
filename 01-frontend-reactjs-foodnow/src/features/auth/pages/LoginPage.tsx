import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes/routes.config';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-paper px-4">
      <div className="relative w-full max-w-sm rounded-ticket border border-muted-border bg-paper p-8 shadow-sm">
        <span className="font-mono text-xs uppercase tracking-wider text-primary">Đăng nhập</span>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink">Chào mừng trở lại</h1>

        <div className="mt-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Chưa có tài khoản?{' '}
          <Link to={ROUTES.register} className="font-medium text-primary">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
