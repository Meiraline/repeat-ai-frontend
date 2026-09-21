import { useRef, useState } from 'react';
import { Link, useParams, type MetaFunction } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { useDiploma, requestDiploma, diplomaKey, diplomaNameSchema } from '@/features/diplomas';
import { useSessionActions } from '@/features/auth';
import { ApiError } from '@/shared/api/errors';
import { Workspace } from '../workspace/Workspace';
import styles from '../exam/ExamPage.module.css';
export const meta: MetaFunction = () => [
  { title: 'Диплом — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function DiplomaPage() {
  const { id = '' } = useParams();
  return <DiplomaScreen key={id} id={id} />;
}
function DiplomaScreen({ id }: { id: string }) {
  const query = useDiploma(id),
    client = useQueryClient(),
    { forget } = useSessionActions(),
    [name, setName] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false),
    pending = useRef<{ name: string; key: string } | null>(null);
  async function request() {
    const parsed = diplomaNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return;
    }
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    if (pending.current?.name !== parsed.data)
      pending.current = { name: parsed.data, key: crypto.randomUUID() };
    try {
      client.setQueryData(
        diplomaKey(id),
        await requestDiploma(id, parsed.data, pending.current.key),
      );
      pending.current = null;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await forget();
      else setError(e instanceof Error ? e.message : 'Не удалось создать заявку.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const data = query.data;
  const sampleUrl = data?.certificate?.sampleUrl;
  // Preview assets must stay same-origin; production download URLs need their own approved contract.
  const safeSample =
    sampleUrl &&
    sampleUrl.startsWith('/') &&
    !sampleUrl.startsWith('//') &&
    !sampleUrl.includes('\\')
      ? sampleUrl
      : null;
  return (
    <Workspace title="Диплом" active="diplomas" description={data?.title ?? 'Завершение курса'}>
      <div className={styles.stack}>
        <nav className={styles.actions}>
          <Link to="/app/diplomas">Мои дипломы</Link>
          <Link to={`/app/tracks/${id}`}>К карте курса</Link>
        </nav>
        {query.isError ? (
          <StatusPanel
            state="error"
            title="Диплом недоступен"
            description={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : !data ? (
          <StatusPanel
            state="loading"
            title="Проверяем доступ"
            description="Получаем результат завершения курса."
          />
        ) : data.status === 'locked' ? (
          <section className={styles.panel}>
            <h2>Курс ещё не завершён</h2>
            <p>{data.reason}</p>
            <Link to={`/app/tracks/${id}/project`}>К итоговому проекту</Link>
          </section>
        ) : data.status === 'eligible' ? (
          <div className={styles.columns}>
            <section className={styles.panel}>
              <h2>Подтвердите имя</h2>
              <p>
                Имя сохранится в заявке. После отправки оно не изменится автоматически вместе с
                профилем.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void request();
                }}
              >
                <label className={styles.field}>
                  Имя для диплома
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    autoComplete="name"
                    readOnly={busy}
                  />
                </label>
                {error && <p role="alert">{error}</p>}
                <Button type="submit" disabled={busy} loading={busy}>
                  Подтвердить и создать
                </Button>
              </form>
            </section>
            <aside className={styles.panel}>
              <h2>Предпросмотр написания</h2>
              <p>{name || 'Ваше имя'}</p>
              <p>{data.title}</p>
              <p>
                Тестовый режим: персональный документ пока не формируется. Для проверки скачивания
                используется PNG-образец Figma с демонстрационными данными.
              </p>
            </aside>
          </div>
        ) : data.status === 'generating' ? (
          <section className={styles.panel}>
            <h2>Подготавливаем образец</h2>
            <p role="status">
              Заявка сохранена. Можно обновить страницу — повторная заявка не потребуется.
            </p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Обновить статус
            </Button>
          </section>
        ) : (
          <div className={styles.columns}>
            <section className={styles.panel}>
              <h2>Образец документа</h2>
              {safeSample && (
                <img
                  src={safeSample}
                  alt="Незаполненный образец сертификата из Figma. Персональный документ пока не сформирован."
                  width={1200}
                  height={800}
                />
              )}
              <p>Это образец макета, не персональный диплом и не подтверждение квалификации.</p>
            </section>
            <aside className={styles.panel}>
              <h2>Данные заявки</h2>
              <p>{data.certificate?.name}</p>
              <p>{data.title}</p>
              <p>Тестовая заявка № {data.certificate?.id}</p>
              {safeSample ? (
                <div className={styles.stack}>
                  <a href={safeSample} download="repeat-ai-demo-sample.png">
                    Скачать образец PNG
                  </a>
                  <a href={safeSample} target="_blank" rel="noopener noreferrer">
                    Открыть образец в полном размере
                  </a>
                </div>
              ) : (
                <p>Ссылка недоступна.</p>
              )}
            </aside>
          </div>
        )}
      </div>
    </Workspace>
  );
}
