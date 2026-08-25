# PROJECT-RULES.md — Frontend

## Tech Stack
- **Framework:** React 19 + TypeScript (Vite, React Router)
- **State management:** TanStack Query (server state) + Zustand (global client state) + `useState` (local)
- **Styling:** Tailwind CSS only — tokens in `tailwind.config.ts`, no CSS files, no CSS-in-JS
- **HTTP client:** Axios (single instance in `shared/api/client.ts` with interceptors)

## 1. Feature Structure

```
src/features/orders/
├── components/
│   ├── OrderCard.tsx
│   ├── OrderStatusTimeline.tsx
│   └── OrderCard.test.tsx      # co-located test
├── hooks/
│   ├── useOrders.ts            # TanStack Query wrapper
│   └── useOrderStatusSocket.ts # Socket.IO subscription
├── services/orders.service.ts  # ONLY place axios is called
├── stores/cart.store.ts        # Zustand, client-only state
├── types/orders.types.ts       # mirrors API_SPEC response DTOs
├── utils/format-order-code.ts
├── index.ts                    # public barrel — the ONLY import surface
└── context.md                  # what this feature owns + public exports
```

## 2. Naming Conventions

| Item | Style | Example |
|---|---|---|
| Feature folders | kebab-case | `driver-tracking/` |
| Components | PascalCase, one per file | `OrderStatusTimeline.tsx` |
| Hooks | `use` + camelCase | `useOrders()`, `useDriverLocation()` |
| Services | `<feature>.service.ts` | `orders.service.ts` |
| Stores | `<name>.store.ts` | `cart.store.ts` |
| Types | PascalCase, **no `I` prefix** | `Order`, `OrderStatus`, `CreateOrderPayload` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_CART_ITEMS` |
| Event handlers | `handle<Event>` / prop `on<Event>` | `handleSubmit`, `onOrderSelect` |

## 3. Feature Rules

- Each feature owns its API calls, types, components, and state. Nothing else reaches inside it.
- **Export only via `index.ts`.**

```ts
// ❌ DON'T
import { OrderCard } from '@/features/orders/components/OrderCard';

// ✅ DO
import { OrderCard, useOrders } from '@/features/orders';
```

- Cross-feature communication, in order of preference:
  1. **URL params / route state** — `/orders/:id` is the source of truth for "which order", not a store.
  2. **Query cache** — `queryClient.invalidateQueries(['orders'])` after a payment succeeds; no direct call into the orders feature.
  3. **Global state (minimal)** — only `auth.store.ts` and `notification.store.ts` in `shared/stores/`. Cart lives inside `orders/`.
- **Shared components location:** `src/components/ui/` (Button, Input, Modal, Skeleton — presentational, no business logic). Shared hooks/utils/api in `src/shared/`.

## 4. Component Rules

- One component per file; file name === component name.
- Co-locate tests (`OrderCard.test.tsx`) next to the component. No separate styles file — Tailwind only.
- **Props typing required** — explicit `type Props`, never `any`, never untyped destructure.
```ts
type OrderCardProps = { order: Order; onSelect?: (id: string) => void };
export function OrderCard({ order, onSelect }: OrderCardProps) { ... }
```
- **Max 150 lines per component.** Past that: extract a child component or move logic into a hook.
- Prefer composition over boolean prop explosion (`<Card><Card.Header/></Card>` over `showHeader`).

## 5. Code Patterns (MUST follow)

**API calls — service files only, typed both ways.**
```ts
// orders.service.ts
export const ordersService = {
  create: (payload: CreateOrderPayload) =>
    apiClient.post<ApiResponse<Order>>('/orders', payload).then(r => r.data.data),
};
// useOrders.ts
export const useCreateOrder = () =>
  useMutation({ mutationFn: ordersService.create });
```

**State — local first.** `useState` → lift to parent → TanStack Query (server data) → Zustand (only if truly global and client-owned). Server data never goes into Zustand.

**Error handling** — `ErrorBoundary` per route + toast for mutations. Map API `error.code` to user-facing copy.
```ts
onError: (e) => toast.error(mapErrorCode(e.code)) // ORDER_3009 → "Đơn vừa được cập nhật, thử lại"
```

**Loading states** — skeletons for content areas, spinner only inside buttons. Never a blank screen.
```tsx
if (isLoading) return <OrderCardSkeleton count={3} />;
```

**Forms** — React Hook Form + Zod resolver. Zod schema is the single source of validation truth, mirroring the backend DTO.

## 6. Anti-patterns (MUST NOT do)

| ❌ DON'T | ✅ DO |
|---|---|
| `import { Order } from '@/features/orders/types/orders.types'` | `import type { Order } from '@/features/orders'` |
| `axios.get('/orders')` inside a component | Call `useOrders()` → service → axios |
| Price/discount math inside JSX | Compute in a hook or `utils/`, render the result |
| Passing `order` through 4 component levels | Context within the feature, or restructure the tree |
| `const data: any = await res.json()` | Type the response: `ApiResponse<Order>` |
| `style={{ marginTop: 12 }}` | `className="mt-3"` — inline styles only for runtime-computed values (e.g. map marker position) |
| `bg-[#FF6B35]` | `bg-primary` — arbitrary values mean a missing design token |

## 7. Git Workflow

- **Branch:** `<type>/<feature>-<short-desc>` → `feat/orders-status-timeline`, `fix/cart-quantity-sync`
- **Commit:** Conventional Commits with feature scope → `feat(orders): add realtime status timeline`
- **PR scope:** one feature per PR · no unrelated formatting churn · `context.md` updated when public exports change · typecheck + lint + tests green · no `any`, no `console.log`.

## 8. Testing

- **Location:** co-located — `components/OrderCard.test.tsx`, `hooks/useOrders.test.ts`
- **What to test:** user-visible behavior (React Testing Library), hook state transitions, form validation rules, error-code → message mapping. Mock at the **service** layer (MSW), never mock axios directly.
- **Don't test:** Tailwind classes, implementation details, third-party library internals.
- **Coverage focus:** cart/price calculation, order status transitions, and payment flows require explicit test cases. Presentational components are smoke-tested only.

## React 19-Specific Additions

- **Server state ≠ client state.** TanStack Query owns anything from the API — never mirror it into `useState`/Zustand.
- **Query keys** are feature-scoped arrays: `['orders', 'list', filters]`, `['orders', 'detail', id]`. Invalidate by prefix.
- **`useEffect` is a last resort** — only for external system sync (Socket.IO subscription, map SDK). Derived values are computed during render, not stored in state.
```ts
// ❌ DON'T: useEffect(() => setTotal(sum(items)), [items])
// ✅ DO:    const total = useMemo(() => sum(items), [items]);
```
- **Socket.IO** lives in one hook per feature (`useOrderStatusSocket`), which pushes into the query cache via `queryClient.setQueryData` — components never touch the socket instance.
- **Actions & transitions:** use `useTransition` / `useOptimistic` for optimistic UI (e.g. cart quantity), reconciled by query invalidation on settle.
- **`key` for identity:** never array index for lists that reorder (cart items, order lists) — use the entity `id`.
- **Code splitting:** every route lazy-loaded via `React.lazy`; each role dashboard (customer/vendor/driver/admin) is a separate chunk.
