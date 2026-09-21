import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { ConsentRow } from './ConsentRow';
it('keeps legal links separate from consent and submits a native checkbox value', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <ConsentRow name="consent" termsHref="#terms" privacyHref="#privacy" />
    </form>,
  );
  const checkbox = screen.getByRole('checkbox', { name: /Я принимаю/ });
  await user.click(screen.getByRole('link', { name: 'условия использования' }));
  expect(checkbox).not.toBeChecked();
  await user.click(screen.getByText('Я принимаю'));
  expect(checkbox).toBeChecked();
  expect(new FormData(container.querySelector('form')!).get('consent')).toBe('on');
  await user.click(checkbox);
  expect(checkbox).not.toBeChecked();
});
