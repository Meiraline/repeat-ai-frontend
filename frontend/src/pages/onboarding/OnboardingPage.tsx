import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, type MetaFunction } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { OnboardingForm } from '@/components/organisms/OnboardingForm';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { useOnboarding, saveOnboarding, type OnboardingState } from '@/features/onboarding';
import { useSessionActions, type Profile } from '@/features/auth';
import { ApiError } from '@/shared/api/errors';
import { defaultPreferences, onboardingSteps } from './onboarding-content';
export const meta: MetaFunction = () => [
  { title: 'Знакомство с сервисом — Репит.центр' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function OnboardingPage() {
  const query = useOnboarding();
  const profile = useOutletContext<Profile>();
  if (query.isPending)
    return (
      <main id="main" tabIndex={-1} className="boot-message">
        <StatusPanel
          state="loading"
          title="Открываем настройки"
          description="Восстанавливаем ваш шаг."
        />
      </main>
    );
  if (query.isError)
    return (
      <main id="main" tabIndex={-1} className="boot-message">
        <StatusPanel
          state="error"
          title="Не удалось открыть настройки"
          description={query.error.message}
          onRetry={() => void query.refetch()}
        />
        <Link to="/app">Перейти в кабинет</Link>
      </main>
    );
  return <OnboardingFlow initial={query.data} displayName={profile.displayName} />;
}
function OnboardingFlow({
  initial,
  displayName,
}: {
  initial: OnboardingState;
  displayName: string;
}) {
  const [state, setState] = useState<OnboardingState>(() => ({
    ...initial,
    values: { ...defaultPreferences, displayName, certificateName: displayName, ...initial.values },
  }));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const { forget } = useSessionActions();
  const content = onboardingSteps[state.step]!;
  useEffect(() => {
    document.querySelector<HTMLElement>('h1')?.focus();
    window.scrollTo({ top: 0 });
  }, [state.step]);
  async function move(step: number, complete = false) {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError('');
    try {
      const next = await saveOnboarding({ ...state, step, complete });
      setState(next);
      client.setQueryData(['onboarding'], next);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) await forget();
      else
        setError(
          error instanceof ApiError
            ? error.message
            : 'Не удалось сохранить настройки. Ваши изменения остались в форме.',
        );
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <AuthTemplate {...content} onboarding reassurance="Все параметры можно изменить позже">
      {state.step === 9 ? (
        <section>
          <h1 tabIndex={-1}>Настройки сохранены</h1>
          <p>Знакомство завершено. Вы можете перейти к своему обучению.</p>
          <ul>
            {[
              'Курсы',
              'Учебный ритм',
              'ИИ-наставник',
              'Аналитика',
              'Материалы',
              'Экзамены',
              'Диплом',
            ].map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          <Link to="/app">Перейти в кабинет</Link>
          <p>
            <Link to="/app/plans/new">Создать первый курс</Link>
          </p>
        </section>
      ) : (
        <OnboardingForm
          step={state.step}
          title={content.formTitle}
          description={content.formDescription}
          fields={content.fields}
          values={state.values}
          pending={pending}
          error={error}
          onChange={(key, value) =>
            setState((s) => ({ ...s, values: { ...s.values, [key]: value } }))
          }
          onNext={() => void move(state.step + 1, state.step === 8)}
          onBack={() => (state.step === 0 ? void navigate('/app') : void move(state.step - 1))}
          onSkip={() => void move(9, true)}
        />
      )}
    </AuthTemplate>
  );
}
