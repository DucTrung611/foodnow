# Frontend: FoodNow

## Tech Stack
  - React 19 (Vite) + TypeScript: SPA behind auth, no SEO need — instant HMR, small config surface vs. a meta-framework
  - TanStack Query: caches/invalidates calls to the `{success,data}` envelope from `API_SPEC.md`; `setQueryData` is the natural sink for Socket.IO pushes like `order:status_changed`
  - Zustand: only `auth.store.ts` and `notification.store.ts` are truly global — no Redux boilerplate needed for a solo project
  - Axios: interceptors handle JWT attach + refresh-on-401, cleaner than raw `fetch` for this
  - Tailwind CSS: fast iteration solo, no separate stylesheets to keep in sync with markup

## Documentation

### Must Read
- @docs/PROJECT-RULES-FRONTEND.md - Conventions, patterns, MUST/MUST NOT
- @docs/ARCHITECTURE-FRONTEND.md - Folder structure, components, state

### Reference
- @../00-docs/API_SPEC.md - API contract to consume
- @../00-docs/DATABASE.md - Data model reference

## Quick Reference

### Feature Location
`src/features/[name]/` - Each feature owns its components, hooks, services, stores, types
`src/app/` - Route files only (entry, routes, providers, layouts), no business logic

### Public Exports
Always via `index.ts` file (barrel export)

## Skills
- **`frontend-design`** (`.claude/skills/frontend-design/`) — use for any new page/screen or visual redesign in this app. Pushes toward a distinctive palette, type pairing, and layout for the actual subject (food ordering, live tracking) instead of generic AI-template defaults. Apply before building UI, not after.
- **`testing`** (`.claude/skills/testing/`) — use whenever writing or running tests here. Vitest + React Testing Library + MSW; tests are co-located (`Component.test.tsx`, `useHook.test.ts`); shared setup/mocks/render helpers live in `src/test/`. Mock at the HTTP layer with MSW, never mock axios or a feature's own service/hook directly.
