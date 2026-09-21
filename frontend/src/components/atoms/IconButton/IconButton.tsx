import type { ComponentPropsWithRef } from 'react';
import { Icon, type IconName } from '@/components/quarks/Icon';
import styles from './IconButton.module.css';
type Props = Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  icon: IconName;
  label: string;
  appearance?: 'outlined' | 'plain';
};
export function IconButton({
  icon,
  label,
  appearance = 'outlined',
  type = 'button',
  className = '',
  ...props
}: Props) {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      className={`${styles.button} ${styles[appearance]} ${className}`}
    >
      <Icon name={icon} size={22} />
    </button>
  );
}
