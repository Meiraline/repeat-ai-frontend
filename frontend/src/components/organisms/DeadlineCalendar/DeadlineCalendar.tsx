import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import styles from './DeadlineCalendar.module.css';
type Deadline = { id: string; title: string; date: string };
export function DeadlineCalendar({ deadlines }: { deadlines: Deadline[] }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const offset = (month.getDay() + 6) % 7,
    days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    today = new Date();
  return (
    <section className={styles.panel}>
      <h2>Календарь дедлайнов</h2>
      <div className={styles.controls}>
        <Button
          size="small"
          variant="neutral"
          aria-label="Предыдущий месяц"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          Назад
        </Button>
        <p aria-live="polite">
          {month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
        </p>
        <Button
          size="small"
          variant="neutral"
          aria-label="Следующий месяц"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          Далее
        </Button>
      </div>
      <table className={styles.calendar}>
        <caption className="visually-hidden">Даты дедлайнов</caption>
        <thead>
          <tr>
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
              <th key={d} scope="col">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil((offset + days) / 7) }, (_, week) => (
            <tr key={week}>
              {Array.from({ length: 7 }, (_, day) => {
                const number = week * 7 + day - offset + 1;
                if (number < 1 || number > days) return <td key={day} />;
                const date = new Date(month.getFullYear(), month.getMonth(), number),
                  has = deadlines.some(
                    (d) => new Date(d.date).toDateString() === date.toDateString(),
                  );
                return (
                  <td key={day}>
                    <span
                      className={has ? styles.mark : undefined}
                      aria-current={
                        date.toDateString() === today.toDateString() ? 'date' : undefined
                      }
                    >
                      {number}
                      {has && <span className="visually-hidden"> — есть дедлайн</span>}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Ближайшие дедлайны</h3>
      {deadlines.length ? (
        <ul className={styles.list}>
          {[...deadlines]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((d) => (
              <li key={d.id}>
                <strong>{d.title}</strong>
                <time dateTime={d.date}>
                  {new Date(d.date).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </li>
            ))}
        </ul>
      ) : (
        <p>Запланированных дедлайнов пока нет.</p>
      )}
    </section>
  );
}
