import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Dialog.module.css';
export function Dialog({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
      if (wide) heading.current?.focus();
    }
    return () => {
      if (dialog?.open) dialog.close();
      if (open && previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open, wide]);
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${wide ? styles.wide : ''}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 ref={heading} tabIndex={wide ? -1 : undefined} id={titleId}>
        {title}
      </h2>
      {children}
    </dialog>
  );
}
