import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

// Presentational component — smoke-tested only, per PROJECT-RULES-FRONTEND.md §8.
describe('Button', () => {
  it('renders its children and responds to clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Đặt hàng</Button>);

    const button = screen.getByRole('button', { name: 'Đặt hàng' });
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables the button and blocks clicks while isLoading', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} isLoading>
        Đặt hàng
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Đặt hàng' });
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
