import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Icon } from '@/components/quarks/Icon';
import styles from './Button.module.css';
export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'outline' | 'secondary' | 'neutral' | 'danger';
  size?: 'small' | 'medium' | 'auth';
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
};
export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  loadingLabel = 'Загрузка',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  disabled,
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${className}`}
    >
      {loading ? <Icon name="spinner" size={20} spin /> : leadingIcon}
      <span className={styles.label}>{children}</span>
      {loading && <span className="visually-hidden">{loadingLabel}</span>}
      {!loading && trailingIcon}
    </button>
  );
}
