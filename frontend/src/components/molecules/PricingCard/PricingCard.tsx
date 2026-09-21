import { Button } from '@/components/atoms/Button';
import styles from './PricingCard.module.css';
export function PricingCard({
  name,
  description,
  price,
  period,
  features,
  credits,
  trialDays,
  current,
  available,
  highlighted,
  onSelect,
}: {
  name: string;
  description: string;
  price: number;
  period: string;
  features: string[];
  credits: number;
  trialDays: number;
  current: boolean;
  available: boolean;
  highlighted?: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={`${styles.card} ${highlighted ? styles.highlighted : ''}`}>
      {highlighted && <span className={styles.badge}>Популярный выбор</span>}
      <h3>{name}</h3>
      <p>{description}</p>
      <strong className={styles.price}>
        {new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          maximumFractionDigits: 0,
        }).format(price)}
      </strong>
      <p>
        {period}
        {trialDays > 0 ? ` · первые ${trialDays} дней бесплатно` : ''}
      </p>
      <ul>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
        <li>{credits} ИИ-кредитов / месяц</li>
      </ul>
      <div className={styles.action}>
        {current ? (
          <p>Текущий тариф</p>
        ) : (
          <Button fullWidth variant="outline" disabled={!available} onClick={onSelect}>
            {available ? 'Выбрать Пилот' : 'В будущем'}
          </Button>
        )}
      </div>
    </article>
  );
}
