import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams, type MetaFunction } from 'react-router';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { AuthForm, type AuthField } from '@/components/organisms/auth/AuthForm';
import { Dialog } from '@/components/molecules/Dialog';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import { Icon } from '@/components/quarks/Icon';
import {
  login,
  register,
  restore,
  reset,
  verify,
  loginSchema,
  registerSchema,
  resetSchema,
  emailSchema,
  safeReturnPath,
  useSessionActions,
} from '@/features/auth';
import { formErrors } from '@/shared/lib/form-errors';
import { ApiError } from '@/shared/api/errors';
import { env } from '@/shared/config/env';
import { authContent, type AuthMode } from './auth-content';
import styles from './AuthPage.module.css';

export const meta: MetaFunction = () => [
  { title: 'Доступ к сервису — Репит.центр' },
  { name: 'robots', content: 'noindex, nofollow' },
  { name: 'referrer', content: 'no-referrer' },
];
const email: AuthField = {
  name: 'email',
  label: 'Email',
  type: 'email',
  autoComplete: 'email',
  maxLength: 254,
};
const password: AuthField = {
  name: 'password',
  label: 'Пароль',
  type: 'password',
  autoComplete: 'current-password',
  maxLength: 128,
};
const titles = {
  login: 'Войти',
  register: 'Создать аккаунт',
  restore: 'Восстановить доступ',
  reset: 'Новый пароль',
};
const descriptions = {
  login: 'Введите email и пароль, чтобы продолжить обучение.',
  register: 'Заполните три поля — это займёт меньше минуты.',
  restore: 'Если аккаунт зарегистрирован на этот адрес, на почту придёт ссылка для смены пароля.',
  reset: 'Придумайте новый пароль и повторите его.',
};
export default function AuthPage() {
  const params = useParams();
  if (!params.mode || !Object.hasOwn(authContent, params.mode))
    throw new Response(null, { status: 404 });
  const mode = (
    params.mode && Object.hasOwn(authContent, params.mode) ? params.mode : 'login'
  ) as AuthMode;
  return <AuthScreen key={mode} mode={mode} />;
}
function AuthScreen({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const returnPath = safeReturnPath(search.get('returnTo'));
  const loginHref = `/auth/login?returnTo=${encodeURIComponent(returnPath)}`;
  const { refresh, forget } = useSessionActions();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const token = useRef(search.get('token') ?? '');
  useEffect(() => {
    if (search.has('token')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState(window.history.state, '', url.pathname + url.search);
    }
  }, [search]);
  useEffect(() => {
    if (!deadline) return;
    const update = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  async function act(action: () => Promise<void>) {
    if (pending) return;
    setErrors({});
    setPending(true);
    try {
      await action();
    } catch (error) {
      if (
        (mode === 'reset' || mode === 'verify') &&
        error instanceof ApiError &&
        (error.status === 410 ||
          error.code === 'TOKEN_EXPIRED' ||
          error.fieldErrors.some(
            (field) => field.field === 'token' && /TOKEN_(INVALID|EXPIRED)/.test(field.code),
          ))
      ) {
        void navigate(`/auth/invalid?purpose=${mode === 'verify' ? 'verify' : 'reset'}`, {
          replace: true,
        });
      } else setErrors(formErrors(error));
    } finally {
      setPending(false);
    }
  }
  async function submit(raw: Record<string, unknown>) {
    await act(async () => {
      if (mode === 'login') {
        const values = loginSchema.parse(raw);
        await login({ ...values, returnPath });
        if (!(await refresh()))
          throw new ApiError(
            'Не удалось сохранить сессию. Разрешите cookies и попробуйте ещё раз.',
            401,
            'SESSION_UNAVAILABLE',
          );
        void navigate(returnPath, { replace: true });
      } else if (mode === 'register') {
        const values = registerSchema.parse(raw);
        const termsVersion = env.enableMocks
          ? 'preview-terms-v1'
          : import.meta.env.VITE_TERMS_VERSION;
        const privacyVersion = env.enableMocks
          ? 'preview-privacy-v1'
          : import.meta.env.VITE_PRIVACY_VERSION;
        if (!termsVersion || !privacyVersion) {
          setErrors({ form: 'Регистрация пока недоступна. Попробуйте позже.' });
          return;
        }
        await register({
          ...values,
          consent: { termsVersion, privacyVersion, acceptedAt: new Date().toISOString() },
        });
        void navigate(`/auth/verify?returnTo=${encodeURIComponent(returnPath)}`, { replace: true });
      } else if (mode === 'restore') {
        const result = await restore(emailSchema.parse(raw.email));
        setDeadline(Date.now() + result.resendAfterSec * 1000);
        setSent(true);
      } else if (mode === 'reset') {
        const values = resetSchema.parse(raw);
        await reset(token.current, values.newPassword);
        await forget();
        void navigate('/auth/reset-done', { replace: true });
      }
    });
  }
  const isForm = mode === 'login' || mode === 'register' || mode === 'restore' || mode === 'reset';
  const missingToken = mode === 'reset' && !token.current;
  const invalidVerification = mode === 'invalid' && search.get('purpose') === 'verify';
  function closeSent() {
    setSent(false);
    requestAnimationFrame(() =>
      document.querySelector<HTMLInputElement>('input[name="email"]')?.focus(),
    );
  }
  const fields: AuthField[] =
    mode === 'register'
      ? [
          { name: 'displayName', label: 'Имя', autoComplete: 'nickname', maxLength: 100 },
          email,
          {
            ...password,
            autoComplete: 'new-password',
            hint: '8–128 символов, заглавная буква и цифра.',
          },
        ]
      : mode === 'restore'
        ? [email]
        : mode === 'reset'
          ? [
              {
                ...password,
                name: 'newPassword',
                label: 'Новый пароль',
                autoComplete: 'new-password',
                hint: '8–128 символов, заглавная буква и цифра.',
              },
              {
                ...password,
                name: 'confirmation',
                label: 'Повторите пароль',
                autoComplete: 'new-password',
              },
            ]
          : [email, password];
  return (
    <AuthTemplate {...authContent[missingToken ? 'invalid' : mode]}>
      {isForm && !missingToken ? (
        <AuthForm
          title={titles[mode]}
          description={descriptions[mode]}
          fields={fields}
          errors={errors}
          pending={pending}
          onSubmit={submit}
          consent={mode === 'register'}
          disabled={mode === 'restore' && remaining > 0}
          submitLabel={
            mode === 'restore'
              ? remaining > 0
                ? `Отправить ещё раз через ${remaining} с`
                : 'Получить ссылку'
              : mode === 'reset'
                ? 'Сохранить пароль'
                : titles[mode]
          }
          beforeSubmit={
            mode === 'login' ? (
              <Link className={styles.link} to="/auth/restore">
                Забыли пароль?
              </Link>
            ) : undefined
          }
          footer={
            mode === 'login' ? (
              <p className={styles.caption}>
                Нет аккаунта?{' '}
                <Link to={`/auth/register?returnTo=${encodeURIComponent(returnPath)}`}>
                  Создать аккаунт
                </Link>
              </p>
            ) : (
              <Link className={styles.link} to={loginHref}>
                Вернуться ко входу
              </Link>
            )
          }
        />
      ) : (
        <section className={styles.status}>
          <h1>
            {missingToken || mode === 'invalid'
              ? 'Ссылка недействительна'
              : mode === 'verify'
                ? token.current
                  ? 'Подтвердите email'
                  : 'Проверьте почту'
                : mode === 'verified'
                  ? 'Email подтверждён'
                  : 'Пароль обновлён'}
          </h1>
          <p>
            {missingToken || mode === 'invalid'
              ? 'Ссылка отсутствует, уже использована или срок её действия истёк.'
              : mode === 'verify'
                ? token.current
                  ? 'Нажмите кнопку, чтобы подтвердить адрес электронной почты.'
                  : 'Перейдите по ссылке в письме, чтобы подтвердить адрес. Проверьте также папку «Спам».'
                : 'Теперь можно войти в аккаунт и продолжить обучение.'}
          </p>
          {errors.form && (
            <p role="alert" className={styles.error}>
              {errors.form}
            </p>
          )}
          <div
            className={`${styles.statusBox} ${mode === 'verify' ? '' : missingToken || mode === 'invalid' ? styles.warning : styles.success}`}
          >
            {!pending && (
              <Icon
                name={
                  mode === 'verify'
                    ? 'statusInfo'
                    : missingToken || mode === 'invalid'
                      ? 'statusWarning'
                      : 'statusSuccess'
                }
                size={72}
              />
            )}
            {pending ? (
              <Spinner size={48} />
            ) : (
              <strong>
                {mode === 'verify'
                  ? 'Ждём подтверждения'
                  : missingToken || mode === 'invalid'
                    ? 'Нужна действующая ссылка'
                    : 'Готово'}
              </strong>
            )}
          </div>
          {mode === 'verify' && token.current ? (
            <Button
              fullWidth
              loading={pending}
              onClick={() =>
                void act(async () => {
                  await verify(token.current);
                  token.current = '';
                  void navigate('/auth/verified', { replace: true });
                })
              }
            >
              Подтвердить email
            </Button>
          ) : null}
          {mode === 'verify' && !token.current ? (
            <p className={styles.caption}>Повторная отправка письма пока недоступна.</p>
          ) : null}
          <Link
            className={styles.link}
            to={
              invalidVerification
                ? '/auth/verify'
                : missingToken || mode === 'invalid'
                  ? '/auth/restore'
                  : mode === 'verified'
                    ? '/auth/login?returnTo=%2Fonboarding'
                    : loginHref
            }
          >
            {invalidVerification
              ? 'Вернуться к подтверждению email'
              : missingToken || mode === 'invalid'
                ? 'Запросить новую ссылку для пароля'
                : 'Войти'}
          </Link>
          {mode === 'verify' && !token.current && (
            <Link to="/auth/register">Указали неверный email? Изменить</Link>
          )}
        </section>
      )}
      <Dialog open={sent} title="Проверьте почту" onClose={closeSent}>
        <p>
          Если аккаунт существует, мы отправили ссылку для смены пароля. Это сообщение одинаково для
          любого email.
        </p>
        <div className={styles.actions}>
          <Button onClick={() => void navigate(loginHref)}>Вернуться ко входу</Button>
          <Button variant="outline" onClick={closeSent}>
            Закрыть
          </Button>
        </div>
      </Dialog>
    </AuthTemplate>
  );
}
