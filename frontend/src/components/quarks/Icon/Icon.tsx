import type { CSSProperties } from 'react';
import mail from '@/assets/icons/mail.png';
import lock from '@/assets/icons/lock.png';
import eye from '@/assets/icons/eye.png';
import check from '@/assets/icons/check.png';
import chevronDown from '@/assets/icons/chevron-down.png';
import spinner from '@/assets/icons/spinner.svg';
import user from '@/assets/icons/user.png';
import brain from '@/assets/icons/brain.png';
import statusInfo from '@/assets/icons/status-info.png';
import statusSuccess from '@/assets/icons/status-success.png';
import statusWarning from '@/assets/icons/status-warning.png';
import styles from './Icon.module.css';
import route from '@/assets/icons/route.png';
import book from '@/assets/icons/book.png';
import archive from '@/assets/icons/archive.png';
import settings from '@/assets/icons/settings.png';
import privacy from '@/assets/icons/privacy.png';
import logout from '@/assets/icons/logout.png';
import tutor from '@/assets/icons/tutor.png';
import analytics from '@/assets/icons/analytics.png';
import plus from '@/assets/icons/plus.png';
import phase1 from '@/assets/icons/phase1.png';
import phase2 from '@/assets/icons/phase2.png';
import phase3 from '@/assets/icons/phase3.png';
import phase4 from '@/assets/icons/phase4.png';
import phase5 from '@/assets/icons/phase5.png';

const sources = {
  route,
  book,
  archive,
  settings,
  privacy,
  logout,
  tutor,
  analytics,
  plus,
  phase1,
  phase2,
  phase3,
  phase4,
  phase5,
  mail,
  lock,
  eye,
  check,
  chevronDown,
  spinner,
  user,
  brain,
  statusInfo,
  statusSuccess,
  statusWarning,
};
export type IconName = keyof typeof sources;
type Props = { name: IconName; size?: number; label?: string; spin?: boolean };
export function Icon({ name, size = 24, label, spin = false }: Props) {
  return (
    <span
      className={`${styles.icon} ${spin ? styles.spin : ''}`}
      style={
        {
          '--icon-size': `${size / 16}rem`,
          '--icon-source': `url("${sources[name]}")`,
        } as CSSProperties
      }
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {name === 'chevronDown' ? (
        <span className={styles.tint} />
      ) : (
        <img src={sources[name]} alt="" width={size} height={size} />
      )}
    </span>
  );
}
