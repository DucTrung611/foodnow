# FoodNow — UI/UX Audit Report

**Date:** 2026-08-28
**Method:** Live browser testing (Playwright MCP) against the running app — Frontend `http://localhost:5173`, Backend `http://localhost:3000/api/v1`. No application source code was modified. All findings below were directly observed in the browser (DOM snapshots, screenshots, console/network inspection); anything not verifiable in the browser is explicitly labeled "not implemented" or "not verified" rather than guessed.

**Accounts used:** customer.mai@foodnow.vn, vendor.photruyenthong@foodnow.vn, driver.hung@foodnow.vn, admin@foodnow.vn (all `Password@123`).

Screenshots referenced below are in `ux-audit-screenshots/` (relative to this file).

---

## 0. Cross-cutting issues (affect all roles)

These were each observed in multiple roles/screens; listed once here and referenced from the role sections below.

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| All pages | Socket.IO never connects — every page load (logged in or out) throws repeated `Access to XMLHttpRequest at 'http://localhost:3000/socket.io/...' blocked by CORS policy`. Confirmed with a controlled two-session test: vendor advanced order `FN-260828-1465` from "Đã xác nhận" → "Đang chuẩn bị" while the customer had the order page open; the customer's screen stayed frozen on the old state indefinitely, and only updated after a manual full page reload. This violates the CLAUDE.md rule that clients must wait for server-confirmed `order:status_changed` events. | **Critical** | Real-time | Add the frontend origin (`http://localhost:5173`, and the deployed origin) to the Socket.IO CORS allow-list on the backend gateway. |
| Any unhandled component error / unknown route | There is no `ErrorBoundary`/`errorElement` anywhere in the router. Any crash (see Driver Earnings below) or unknown route (e.g. `/cart`, a typo'd path) renders React Router's raw default error screen: "Unexpected Application Error! 💿 Hey developer 👋 ... provide your own ErrorBoundary" — no header, no nav, no way back except the browser Back button. | **Critical** | Error recovery | Add a top-level `errorElement`/`ErrorBoundary` with app chrome and a "Go home" action; add a real 404 page. |
| Header (all logged-in states) | No logout control anywhere. Clicking the user's name in the header (only non-link text) does nothing. `/profile` exists but has no sign-out button either. | **Critical** | Navigation | Add an account menu (dropdown or icon) with "Log out" / "Profile" entries, visible in the header for every role. |
| Post-login redirect | Logging in as VENDOR, DRIVER, or ADMIN (reproduced for all three) lands the user on the generic **customer** homepage ("Khám phá nhà hàng" hero, demo order card) — not on their working dashboard (`/vendor/orders`, `/driver/offers`, `/admin/orders`). Nothing in the header links to those dashboards either; the only way to reach them is to already know the URL. | **Critical** | Navigation | Redirect post-login based on `user.role`; add role-appropriate header/nav links (or route non-customer roles straight into their own `Layout` on `/`). |
| Add-to-cart, payment confirm, any failed action | The app has no toast/notification system. Successful actions (`POST /cart/items` → 201, `POST /orders/:id/pay` → 201) produce **zero** visible UI change — no toast, no badge, no state update — and failed actions (e.g. a 403 when a vendor account triggers a customer-only payment call) fail exactly as silently. Confirmed concretely for cart-add (no cart badge exists anywhere) and payment (see Customer §3). | **Critical** | Feedback | Add a toast/snackbar system; surface both success and error responses to the user for every mutating action. |
| Any two tabs, different logins | The refresh token lives in a browser-wide httpOnly cookie. Logging into Tab 2 as a different user silently overwrites Tab 1's session: on Tab 1's next silent `/auth/refresh`, it receives the *second* user's tokens and the header name changes with no warning, dialog, or forced reload. Reproduced concretely (customer tab silently became the vendor's session; confirmed via repeated `POST /auth/refresh → 200` calls returning the wrong identity). | **High** | Auth / session | Either scope tokens per-tab (e.g. `BroadcastChannel`-synced login state with an explicit "switch account" prompt) or explicitly warn/force-reload all tabs when the account identity changes. |
| Vendor & Admin dashboards, 375px width | The dashboard `Sidebar` layout (shared by Vendor and Admin) does not collapse on mobile. Confirmed the page body overflows horizontally (`scrollWidth: 553px` vs `clientWidth: 360px` on `/admin/users`). On `/vendor/orders` mobile, the status-advance button renders as an oversized wrapped black block disproportionate to its card; on `/admin/users` mobile, the status badge and "Khóa" (suspend) button are pushed off-screen and only reachable by horizontal scroll. | **High** | Mobile responsiveness | Make the sidebar collapse to a hamburger/bottom-nav under a breakpoint (e.g. 768px); constrain button widths in `Sidebar`+content grid. Screenshots: `mobile-04-vendor-dashboard-375.png`, `mobile-06-admin-users-375.png`. |
| Main site header, 375px width | The customer header's nav items ("Nhà hàng", "Đơn hàng", user name) wrap to two lines each, cramped directly beside the logo — no hamburger menu. Not broken, but visually cramped and inconsistent with the otherwise clean design. | **Medium** | Mobile responsiveness | Collapse nav into a hamburger/menu button under ~480px. Screenshot: `mobile-01-landing-375.png`. |
| Menu item prices (e.g. restaurant detail page) | Price text renders at 12px, color `rgb(138,127,110)` on background `rgb(251,246,236)` → computed contrast ratio ≈ **3.65:1**, below the WCAG AA minimum of 4.5:1 for normal text. | **Medium** | Accessibility | Darken the muted/secondary text color or increase font size/weight for price text. |
| Every restaurant/menu screen | No restaurant or menu-item photos anywhere in the product — every listing is text-only (name + price). For a food-delivery app this materially hurts appeal/trust and gives users no way to visually recognize a dish. | **Medium** | Consistency/design | Add an `imageUrl` field to restaurants/menu items and render photos (with `alt` text) in list and detail views. |
| `/login` while already authenticated | Navigating to `/login` while logged in still renders the full login form (header shows the logged-in user's name simultaneously) instead of redirecting away. | **Low** | Navigation/consistency | Redirect authenticated users away from `/login` and `/register`. |

---

## 1. Customer

### 1.1 Browse / Search Restaurants

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| `/restaurants` | Restaurant search silently defaults to the browser's raw geolocation with a fixed 5000m radius and **no manual location entry, no radius control, and no filters (category/rating/sort) in the UI** at all, despite the API supporting all of these (`API_SPEC.md` §3, §6). Verified concretely: the automated browser's geolocation resolved to `21.119, 105.789` while all seeded restaurants sit within ~4km of central Hanoi (`21.0285, 105.8542`) — 15km away, outside the 5km radius — so the confirmed-working `GET /restaurants?lat=...&lng=...&radius=5000` legitimately returns `{data: [], total: 0}`. The page then shows only "Không tìm thấy nhà hàng phù hợp." with zero indication that it's a location/radius problem and no way to fix it (no "expand search radius," no "enter address manually," no city-wide fallback). Any real user with imprecise GPS/IP-based geolocation hits this dead end. | **Critical** | Error prevention / Clarity | Add a manual location/address picker and a radius control; on empty results, explain *why* (e.g. "No restaurants within 5km — try expanding your search radius") with an actionable control, rather than a bare "not found" string. Screenshots: `customer-02-restaurants-empty.png`, `customer-03-restaurants-search-empty.png`. |
| `/restaurants` | Even with results (verified directly against the API), the page has no visible restaurant cards layout to evaluate — the UI only ever exposes a single search textbox, no sort/filter chips, no map, no loading skeleton distinguishable from the empty state. | **Medium** | Performance perception / Clarity | Add explicit loading skeletons for the restaurant list distinct from the "no results" empty state. |

### 1.2 Restaurant Menu → Cart

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| Restaurant detail (e.g. `/restaurants/d798b792-...`) | Clicking "Thêm" (add to cart) gives **no feedback at all** — no toast, no button state change, no cart badge anywhere in the header — even though the network call succeeds (`POST /cart/items → 201`). Reloading the same page afterward still shows no cart indicator anywhere. A user has no way to know the item was added, or how many items/what total is in their cart, from this screen. | **Critical** | Feedback | Add a persistent cart summary bar/badge in the header showing item count and subtotal, updated immediately on add; show a toast on add. |
| Any screen (post-cart-add) | There is no cart icon, "View cart" button, or any link to `/checkout` anywhere in the customer UI. The cart/checkout page exists and works (`/checkout`), but is completely undiscoverable without knowing the exact URL. Navigating to the intuitively-named `/cart` instead throws the raw unhandled-route error screen (see §0). | **Critical** | Navigation | Add a visible, persistent "Cart" entry point (header icon/button) that links to `/checkout` whenever the cart is non-empty. Screenshot: `customer-07-cart-route-404-raw-error.png`. |
| Restaurant detail, item customization modal ("Tùy chỉnh") | Working well: option groups, checkboxes with extra price, quantity stepper, and a live-updating "Tổng" (total) all functioned correctly in testing (75.000₫ → 85.000₫ after selecting a +10.000₫ topping). No issues found here — noted for completeness/fairness. | — | — | — |

### 1.3 Checkout / Payment

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| `/checkout` | The checkout summary shows only "Tạm tính" (subtotal, e.g. 55.000₫) — **no delivery fee and no grand total are shown before the order is placed**. The real total (76.000₫, i.e. +21.000₫ delivery fee, +38%) only appears *after* the order is committed, on the order-detail page. A customer commits to an order without knowing the final price. | **Critical** | Error prevention / cost transparency | Fetch and display delivery fee + grand total on the checkout page itself (a preview/quote call) before the "Đặt hàng" button is enabled. Screenshot: `customer-08-checkout-page.png` (subtotal only) vs `customer-09-order-detail-payment.png` (true total revealed after commit). |
| `/checkout` | With only one saved address, it is not pre-selected — the "Đặt hàng" (place order) button starts **disabled** until the user manually clicks the single available address radio. Unnecessary friction for the common case. | **Medium** | Clarity / Error prevention | Auto-select the default (`is_default`) address when there is exactly one, or always. |
| `/checkout` | Placing an order (a real, committing action) requires only a single click — no confirmation step. | **Medium** | Error prevention | Consider a lightweight confirm step (or an explicit "Review order" screen) before final submission, especially once delivery fee/total are shown. |
| Order detail, payment section | Clicking "Xác nhận thanh toán" (confirm payment) gives **no success feedback** — no toast, no "Paid" badge, no visual change of any kind — despite the backend call succeeding (`POST /orders/:id/pay → 201`). Confirmed durable: after a full hard reload, the order status timeline is unchanged and the payment form (method radios + "Xác nhận thanh toán" button) is still fully rendered and clickable, indistinguishable from an unpaid order. This risks a confused customer re-submitting payment. | **Critical** | Feedback | Show a clear "Payment successful" confirmation and replace the payment form with a paid/receipt state once `payment.status` is `SUCCEEDED`. Screenshots: `customer-09-order-detail-payment.png`, `customer-10-order-after-payment-reload.png` (identical state before/after a successful payment). |
| Order detail | Order status only updates on manual reload, never live — see cross-cutting Socket.IO finding (§0). Concretely demonstrated with before/after/reload screenshots. | **Critical** | Real-time | See §0 fix. Screenshots: `realtime-01-customer-before-vendor-action.png`, `realtime-02-customer-no-live-update.png` (identical to 01, despite vendor action in between), `realtime-03-customer-after-manual-reload.png` (now correctly showing "Đang chuẩn bị"). |

### 1.4 Order History / Reorder

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| `/orders` (list) & delivered order detail | Order list itself works well (shows code, status, item count/total, relative time). However, a DELIVERED order's detail page has **no "Reorder" action** and **no "Leave a review" action**, despite the API supporting `POST /orders/:id/reviews` for delivered orders. Both flows appear not implemented in the frontend. | **Medium** | Feature completeness | Add "Đặt lại" (reorder) and "Đánh giá" (review) buttons on delivered order detail pages. |

### 1.5 Profile

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| `/profile` | Page renders correctly (name, role, email/phone, saved addresses) but is **not linked from anywhere in the app** — no header menu item, no nav entry. Only reachable by typing the URL directly. | **High** | Navigation | Add an account/profile entry point in the header (see logout finding above — likely the same missing account-menu component). Screenshot: `customer-05-profile-page.png`. |
| `/profile` | No visible "Add address" action, despite `POST /users/me/addresses` existing in the API. | **Medium** | Feature completeness | Add an "Add address" button/form on the profile page. |

---

## 2. Restaurant Vendor

### 2.1 Incoming Orders Dashboard

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| `/vendor/orders` | Works well: clear list of incoming orders with order code, current status, item count/total, and an explicit next-action button per order (e.g. `Chuyển sang "Đã xác nhận"` → `Chuyển sang "Đang chuẩn bị"` → `Chuyển sang "Chờ tài xế lấy"`). Status-advance actions were tested end-to-end and worked correctly against the API. No accept/reject distinction is exposed (only forward status transitions), but this may be acceptable given no explicit "reject" endpoint in the API spec. Noted for completeness — no defect. | — | — | — |
| `/vendor/orders`, 375px width | The status-advance button renders as an oversized, wrapped black block that dominates the order card, breaking visual hierarchy (see §0 cross-cutting mobile finding). | **High** | Mobile responsiveness | Screenshot: `mobile-04-vendor-dashboard-375.png`. |

### 2.2 Order Detail (as Vendor)

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| `/orders/:id` viewed as VENDOR | The order-detail page is **identical to the customer-facing view**, including a live, fully-interactive "Thanh toán" (payment) panel with payment-method radios and a "Xác nhận thanh toán" button — UI intended only for the customer. Clicking it as a vendor correctly gets rejected server-side (`POST /orders/:id/pay → 403 Forbidden`), confirming backend authorization is correct, **but the frontend shows this UI to the wrong role at all, and shows no error message when the 403 occurs** (button just does nothing, silently). There is also **no vendor-specific action** on this page (accepting/advancing status is only possible from the separate `/vendor/orders` list) — a vendor arriving at an order detail link has no way to act on it here. | **High** | Role-appropriate UI / Feedback | Render role-specific panels on the order-detail page (hide the payment form for non-customer roles; show vendor status-advance controls instead). Surface the 403 as a visible error toast regardless. Screenshot: `vendor-01-order-detail-no-vendor-actions.png`. |

### 2.3 Menu Management

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| `/vendor/menu` | **The entire Menu Management screen is broken.** Only the page title "Thực đơn" renders; no menu items, categories, or "add item" controls appear, with no loading state and no error message shown to the vendor. Root cause (confirmed via console/network inspection): the frontend calls `GET /api/v1/restaurants/{ownerId}/menu` using the vendor's **user id** (`1f83d4a5-f1f5-...`) instead of their **restaurant id** (`d798b792-...`), which 404s. This makes the entire "add/edit/disable menu item" flow in scope for this audit completely non-functional today. | **Critical** | Functional bug | Fix the frontend to pass the vendor's actual restaurant id (from `GET /restaurants?ownerId=me` or an equivalent "my restaurant" endpoint) when fetching/managing the menu; add an error state for failed fetches. Screenshot: `vendor-03-menu-page-broken.png`. |

---

## 3. Driver

### 3.1 Available Orders / Accept

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| `/driver/offers` | The online/offline toggle button's label is ambiguous about current state: it read "Ngoại tuyến" (Offline) by default, changed to "Đang trực tuyến" (Online) after one click, but reverted to showing "Ngoại tuyến" again after a page reload — while an order offer was still visible in the list — with no clear indicator of which state is actually active server-side, and no persistence of the toggle across reloads. | **Medium** | Clarity | Make the button visually encode current status unambiguously (e.g. a colored status pill + separate action label: "● Online — go offline"), and persist/re-fetch availability state on load. |
| `/driver/offers` | Offer cards identify the order only by a truncated internal UUID ("Đơn #7fecc396") instead of the human-readable order code (`FN-260828-1465`) used everywhere else in the app (checkout, order history, vendor dashboard, admin table). | **Low** | Consistency | Show the order code, not a UUID fragment. |
| `/driver/offers` | Accepting an offer (`POST /deliveries/:id/accept → 201`) gives no confirmation toast — the card simply disappears from the list. | **Medium** | Feedback | Show a toast/confirmation ("Đã nhận đơn FN-...") on accept. |
| Post-accept, anywhere | **After accepting a delivery, there is no UI anywhere to confirm pickup or mark the delivery complete.** The accepted order vanishes from `/driver/offers` with nothing replacing it (no "active delivery" card/section), and the order-detail page (`/orders/:id`) shows the same read-only customer-style timeline with zero driver actions — despite the API exposing `POST /deliveries/:id/pickup` and `POST /deliveries/:id/complete`. The driver flow dead-ends immediately after accepting an order. | **Critical** | Functional gap | Add an "Active delivery" view (on `/driver/offers` or a dedicated route) with explicit "Xác nhận lấy hàng" (confirm pickup) and "Xác nhận đã giao" (confirm delivered) actions. Screenshot: `driver-02-no-active-delivery-after-accept.png`. |

### 3.2 Earnings

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| `/driver/earnings` | **Page crashes completely** with an unhandled `TypeError: Cannot read properties of undefined (reading 'map') at DriverEarningsPage.tsx:163:21`, falling through to the raw dev error screen (no header/nav/recovery). The underlying `GET /drivers/me/earnings` call itself returned `200 OK`, so this is a frontend data-shape bug (the component expects an array where the response doesn't provide one, e.g. mismatched response envelope unwrapping). The entire Earnings feature is inaccessible to drivers as a result. | **Critical** | Functional bug | Fix `DriverEarningsPage.tsx` to correctly unwrap/guard the `GET /drivers/me/earnings` response before mapping; add a top-level ErrorBoundary as a safety net regardless (§0). Screenshot: `driver-03-earnings-page-crash.png`. |

---

## 4. Admin

### 4.1 Orders Overview

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| `/admin/orders` | Status column shows raw backend enum values (`READY_FOR_PICKUP`, `PENDING`, `CONFIRMED`, `PREPARING`, `ON_THE_WAY`, `CANCELLED`, `DELIVERED`) instead of the friendly Vietnamese labels used consistently everywhere else in the app ("Chờ xác nhận", "Đang giao", etc.). Jarring and less scannable for non-technical admin staff. | **Medium** | Consistency | Reuse the same status-label mapping/component used on customer/vendor screens. |
| `/admin/orders` | Table rows are **not clickable** (confirmed — clicking a row does not navigate anywhere), and there is **no filter/search UI** (by status/customer/restaurant/driver, all supported by the API per `API_SPEC.md` §6) and **no visible pagination**, despite 11+ orders already in the seed data. There is no way to drill into an order to see items/history, and no visible dispute-intervention action (e.g. force-cancel, refund) anywhere on this screen. | **High** | Missing functionality | Make rows link to order detail; add status/customer/restaurant/driver filters and pagination; surface admin-only intervention actions (cancel/refund) directly from this table or the detail view. Screenshot: `admin-01-orders-table.png`. |

### 4.2 User Management

| Screen | Issue | Severity | Category | Suggested Fix |
|---|---|---|---|---|
| `/admin/users` | Clicking "Khóa" (suspend) executes **immediately with no confirmation dialog** on a real, destructive account action, and — once suspended — there is **no visible "unlock/reactivate" action anywhere** in the UI (the button disappears entirely, leaving only a static "SUSPENDED" label). From the frontend, suspension looks irreversible. Reproduced concretely on a real (seed) account. | **Critical** | Error prevention | Add a confirmation dialog before suspending; add a symmetric "Mở khóa" (reactivate) action when status is `SUSPENDED`, using the same `PATCH /admin/users/:id/status` endpoint. Screenshot: `admin-02-user-suspended-no-confirm-no-undo.png`. |
| `/admin/users`, 375px width | Sidebar layout causes horizontal page overflow (confirmed: `document.body.scrollWidth = 553px` vs `clientWidth = 360px`); the status badge and "Khóa" button are pushed off-screen and reachable only via horizontal scroll. | **High** | Mobile responsiveness | See §0 fix. Screenshot: `mobile-06-admin-users-375.png`. |

---

## Top 5 priority fixes

Ranked by (severity × breadth of impact) vs. estimated implementation effort:

1. **Wire up Socket.IO CORS on the backend gateway.** One backend config change (add `http://localhost:5173`/prod origin to the gateway's allowed origins) unblocks *every* real-time feature the product is built around — order status, driver location, live vendor/driver offers — across all four roles. Highest impact, lowest effort.
2. **Add a global ErrorBoundary + real 404 page, and fix the two confirmed hard crashes** (`/vendor/menu` wrong-id 404, `/driver/earnings` `undefined.map()`). These three fixes turn "the app is broken" into "two features need finishing," and the ErrorBoundary alone prevents any *future* bug from taking down the whole page with a raw dev screen.
3. **Add an account menu (logout + profile link) and role-based post-login redirect.** Currently every non-customer role logs in and lands somewhere irrelevant with no way to find their real dashboard, and no user of any role can log out. This is a small, well-scoped frontend change with outsized impact on basic usability.
4. **Make the cart/checkout flow discoverable and transparent**: add a persistent cart badge/link (the checkout page already exists and works — it's just unreachable), and show delivery fee + grand total *before* order placement instead of only subtotal. This directly affects the core money-making flow of the product.
5. **Finish the Driver "active delivery" flow** (pickup/complete actions) and the **Vendor menu-management fetch bug**. Both are one-screen, well-isolated fixes (a UI section + an id-passing bug, respectively) that currently make two of the four audited roles' core promised flows fully non-functional past their first step.

---

## Finding counts by severity

| Severity | Count |
|---|---|
| Critical | 15 |
| High | 7 |
| Medium | 11 |
| Low | 2 |

(Counts include the cross-cutting §0 table plus all role-specific tables; a few items noted as "no issues found" are excluded.)
