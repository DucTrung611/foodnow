import { RouterProvider } from 'react-router-dom';
import { useBootstrapAuth } from '@/features/auth';
import { QueryProvider } from './providers/QueryProvider';
import { SocketProvider } from './providers/SocketProvider';
import { ToastProvider } from './providers/ToastProvider';
import { router } from './routes';

function AppRouter() {
  // Blocks first render until the silent session refresh resolves, so a
  // reload on a protected route doesn't flash a redirect to /login.
  const isReady = useBootstrapAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <span className="font-mono text-xs text-muted">Đang tải...</span>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <QueryProvider>
      <SocketProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </SocketProvider>
    </QueryProvider>
  );
}
