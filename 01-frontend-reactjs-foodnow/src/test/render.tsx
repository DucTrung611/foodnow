import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

/**
 * Shared test wrapper: QueryClientProvider (retries off, so failures surface
 * immediately instead of after Vitest's default 5s timeout) + MemoryRouter
 * (most hooks/pages call useNavigate/useParams). Use for anything that isn't
 * a pure presentational component.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function AllProviders({ children, initialEntries }: { children: ReactNode; initialEntries?: string[] }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions & { initialEntries?: string[] }) {
  const { initialEntries, ...renderOptions } = options ?? {};
  return render(ui, { wrapper: (props) => <AllProviders {...props} initialEntries={initialEntries} />, ...renderOptions });
}

export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: { initialEntries?: string[] },
) {
  return renderHook(hook, {
    wrapper: ({ children }) => <AllProviders initialEntries={options?.initialEntries}>{children}</AllProviders>,
  });
}

export { screen, waitFor, within } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
