import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Button } from '@/shared/components/ui';
import { ROUTES } from './routes.config';

/**
 * `errorElement` on the router's root pathless route — catches both thrown
 * render errors from any page and unmatched paths (React Router renders a
 * 404 ErrorResponse through the same mechanism), so this is also the app's
 * 404 page. Before this existed, either case fell through to React Router's
 * raw "Unexpected Application Error!" dev screen with no header/nav/recovery.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <Link to={ROUTES.home} className="font-display text-xl font-bold text-ink">
        Food<span className="text-primary">Now</span>
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {isNotFound ? 'Không tìm thấy trang' : 'Đã xảy ra lỗi'}
        </h1>
        <p className="mt-2 max-w-sm font-sans text-sm text-muted">
          {isNotFound
            ? 'Trang bạn tìm không tồn tại hoặc đã bị di chuyển.'
            : 'Có lỗi ngoài dự kiến xảy ra. Vui lòng thử lại hoặc quay về trang chủ.'}
        </p>
      </div>

      <Link to={ROUTES.home}>
        <Button variant="secondary">Về trang chủ</Button>
      </Link>
    </div>
  );
}
