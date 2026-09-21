import { TextLink, type TextLinkProps } from '@/components/atoms/TextLink';
import styles from './PromptLink.module.css';
type Props = TextLinkProps & { prompt: string };
export function PromptLink({ prompt, ...linkProps }: Props) {
  return (
    <p className={styles.prompt}>
      {prompt} <TextLink {...linkProps} />
    </p>
  );
}
