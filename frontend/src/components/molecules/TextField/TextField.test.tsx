import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { TextField } from './TextField';
it('preserves a password when toggled and connects hint and error to its native input', async () => {
  const user = userEvent.setup();
  render(
    <TextField
      label="Пароль"
      type="password"
      hint="Не менее 8 символов"
      error="Пароль слишком короткий"
    />,
  );
  const input = screen.getByLabelText('Пароль');
  await user.type(input, 'example-password');
  expect(input).toHaveAccessibleDescription('Не менее 8 символов Пароль слишком короткий');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  await user.click(screen.getByRole('button', { name: 'Показать пароль' }));
  expect(input).toHaveAttribute('type', 'text');
  expect(input).toHaveValue('example-password');
  await user.click(screen.getByRole('button', { name: 'Скрыть пароль' }));
  expect(input).toHaveAttribute('type', 'password');
});
it('does not reveal a disabled password', async () => {
  render(<TextField label="Пароль" type="password" disabled defaultValue="private" />);
  const action = screen.getByRole('button', { name: 'Показать пароль' });
  expect(action).toBeDisabled();
  await userEvent.click(action);
  expect(screen.getByLabelText('Пароль')).toHaveAttribute('type', 'password');
});
