import type { HTMLAttributes } from 'react';
import styles from './Typography.module.css';
type Props = HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3';
  variant?: 'body' | 'small' | 'large' | 'caption' | 'label' | 'strong' | 'heading';
  tone?: 'default' | 'muted' | 'error';
};
export function Typography({
  as: Tag = 'p',
  variant = 'body',
  tone = 'default',
  className = '',
  ...props
}: Props) {
  return (
    <Tag {...props} className={`${styles.text} ${styles[variant]} ${styles[tone]} ${className}`} />
  );
}
