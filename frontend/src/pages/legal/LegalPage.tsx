import { Link, useParams, type MetaFunction } from 'react-router';
import { PageFrame } from '@/components/templates/PageFrame';
import { env } from '@/shared/config/env';
export const meta: MetaFunction = () => [
  { title: 'Правовая информация — Репит.центр' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function LegalPage() {
  const { document } = useParams();
  if (document !== 'terms' && document !== 'privacy') throw new Response(null, { status: 404 });
  return (
    <PageFrame navigation={<Link to="/auth/register">К регистрации</Link>}>
      <h1>{document === 'privacy' ? 'Политика конфиденциальности' : 'Условия использования'}</h1>
      <p>
        {env.enableMocks
          ? 'Демонстрационный режим: утверждённый юридический документ ещё не предоставлен. Отметка согласия используется только для проверки интерфейса; реальная регистрация не выполняется.'
          : 'Документ готовится к публикации. Регистрация будет доступна после публикации условий и политики.'}
      </p>
    </PageFrame>
  );
}
