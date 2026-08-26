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
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function AllProviders({
  children,
  initialEntries,
  queryClient,
}: {
  children: ReactNode;
  initialEntries?: string[];
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

type ProviderOptions = { initialEntries?: string[]; queryClient?: QueryClient };

export function renderWithProviders(ui: ReactElement, options?: RenderOptions & ProviderOptions) {
  const { initialEntries, queryClient = createTestQueryClient(), ...renderOptions } = options ?? {};
  const result = render(ui, {
    wrapper: (props) => <AllProviders {...props} initialEntries={initialEntries} queryClient={queryClient} />,
    ...renderOptions,
  });
  return { ...result, queryClient };
}

export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: ProviderOptions,
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  const result = renderHook(hook, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={options?.initialEntries} queryClient={queryClient}>
        {children}
      </AllProviders>
    ),
  });
  return { ...result, queryClient };
}

export { screen, waitFor, within } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
