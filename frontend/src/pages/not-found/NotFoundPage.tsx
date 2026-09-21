import { Link, type MetaFunction } from 'react-router';
import { PageFrame } from '@/components/templates/PageFrame';

export const meta: MetaFunction = () => [
  { title: 'Страница не найдена — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];

export default function NotFoundPage() {
  return (
    <PageFrame>
      <h1>Страница не найдена</h1>
      <p>Проверьте адрес или вернитесь на главную.</p>
      <Link to="/">На главную</Link>
    </PageFrame>
  );
}
