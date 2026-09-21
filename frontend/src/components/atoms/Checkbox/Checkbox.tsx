import type { ComponentPropsWithRef } from 'react';
import { Icon } from '@/components/quarks/Icon';
import styles from './Checkbox.module.css';
export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'>;
export function Checkbox({ className = '', ...props }: CheckboxProps) {
  return (
    <span className={`${styles.target} ${className}`}>
      <input {...props} type="checkbox" className={styles.input} />
      <span className={styles.box} aria-hidden="true">
        <Icon name="check" size={14} />
      </span>
    </span>
  );
}
