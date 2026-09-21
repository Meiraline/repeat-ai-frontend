import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog } from './Dialog';
import { Button } from '@/components/atoms/Button';
const meta = {
  title: 'Molecules/Dialog',
  component: Dialog,
  args: {
    open: false,
    title: 'Проверьте почту',
    onClose: () => {},
    children: 'Если аккаунт существует, письмо будет отправлено.',
  },
} satisfies Meta<typeof Dialog>;
export default meta;
export const Keyboard: StoryObj<typeof meta> = {
  render: function Example(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Открыть диалог</Button>
        <Dialog {...args} open={open} onClose={() => setOpen(false)}>
          <p>{args.children}</p>
          <Button onClick={() => setOpen(false)}>Закрыть</Button>
        </Dialog>
      </>
    );
  },
};
