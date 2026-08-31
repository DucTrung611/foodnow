import { useState, type FocusEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth.store';
import { ROUTES } from '@/app/routes/routes.config';
import { useLogout } from '../hooks/useAuth';

type AccountMenuProps = {
  /** Layouts on a dark background (DriverLayout) need light text/border tokens flipped. */
  variant?: 'light' | 'dark';
};

/**
 * The only account entry point in the app — previously there was no logout
 * control anywhere (UX-AUDIT-REPORT.md §0), so every layout renders this.
 */
export function AccountMenu({ variant = 'light' }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  if (!user) return null;

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
  };

  const textClass = variant === 'dark' ? 'text-paper' : 'text-ink';
  const borderClass = variant === 'dark' ? 'border-paper/20' : 'border-muted-border';
  const panelClass = variant === 'dark' ? 'bg-ink text-paper' : 'bg-paper text-ink';

  return (
    <div className="relative" onBlur={handleBlur}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-2 rounded-ticket px-2 py-1 font-sans text-sm font-medium ${textClass} hover:opacity-80`}
      >
        {user.fullName}
        <span aria-hidden className="text-xs opacity-60">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-ticket border shadow-lg ${borderClass} ${panelClass}`}
        >
          <Link
            to={ROUTES.profile}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm hover:bg-primary-bg hover:text-primary-hover"
          >
            Hồ sơ
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="block w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-danger-bg disabled:opacity-50"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
