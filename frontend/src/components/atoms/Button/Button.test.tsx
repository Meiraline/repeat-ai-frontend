import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Button } from './Button';
it('prevents repeated submit while loading and defaults other buttons to non-submit', async () => {
  const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
  render(
    <form onSubmit={submit}>
      <Button type="submit" loading>
        Войти
      </Button>
      <Button>Отмена</Button>
    </form>,
  );
  await userEvent.click(screen.getByRole('button', { name: /Войти/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /Войти/ })).toHaveAttribute('aria-busy', 'true');
});
