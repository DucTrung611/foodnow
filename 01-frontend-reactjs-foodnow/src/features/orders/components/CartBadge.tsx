import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes/routes.config';
import { useCart } from '../hooks/useCart';

/**
 * Persistent cart entry point in the header — before this there was no cart
 * icon/link anywhere, so a non-empty cart (and the working /checkout page)
 * was undiscoverable except by typing the URL directly
 * (UX-AUDIT-REPORT.md §1.2).
 */
export function CartBadge() {
  const { data: cart } = useCart();
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  if (itemCount === 0) return null;

  return (
    <Link
      to={ROUTES.checkout}
      aria-label={`Giỏ hàng, ${itemCount} món`}
      className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-mono text-xs font-bold text-paper hover:bg-primary-hover"
    >
      <span aria-hidden>🛒</span>
      {itemCount}
    </Link>
  );
}
