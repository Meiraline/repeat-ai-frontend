import type { ComponentPropsWithRef } from 'react';
import styles from './TextLink.module.css';
export type TextLinkProps = ComponentPropsWithRef<'a'> & {
  href: string;
  size?: 'medium' | 'small' | 'caption';
  standalone?: boolean;
};
export function TextLink({
  size = 'medium',
  standalone = false,
  tabIndex = 0,
  className = '',
  ...props
}: TextLinkProps) {
  return (
    <a
      {...props}
      tabIndex={tabIndex}
      className={`${styles.link} ${styles[size]} ${standalone ? styles.standalone : ''} ${className}`}
    />
  );
}
