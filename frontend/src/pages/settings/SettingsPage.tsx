import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useOutletContext } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import {
  ProfileSettingsFields,
  type ProfileSettingsValues,
} from '@/components/organisms/ProfileSettingsFields';
import {
  getProfile,
  saveProfile,
  profilePatchSchema,
  sessionKey,
  useSessionActions,
  type Profile,
} from '@/features/auth';
import { ApiError } from '@/shared/api/errors';
import { env } from '@/shared/config/env';
import { Workspace } from '../workspace/Workspace';
import styles from './SettingsPage.module.css';
import { DeviceSettings } from './DeviceSettings';
import { AppearanceSection } from './AppearanceSection';
import { MentorSection } from './MentorSection';

export function meta() {
  return [{ title: 'Настройки аккаунта — repeat.ai' }, { name: 'robots', content: 'noindex' }];
}
export default function SettingsPage() {
  const profile = useOutletContext<Profile>();
  const [base, setBase] = useState(profile);
  const [draft, setDraft] = useState<ProfileSettingsValues>(profile);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [needsReload, setNeedsReload] = useState(false);
  const client = useQueryClient();
  const { forget } = useSessionActions();
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const dirty =
    JSON.stringify(profilePatchSchema.safeParse(draft).data) !==
    JSON.stringify(profilePatchSchema.safeParse(base).data);
  function change<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage('');
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (request.current || needsReload) return;
    const parsed = profilePatchSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Проверьте поля формы.');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const saved = await saveProfile(
        { ...parsed.data, certificateName: parsed.data.certificateName || null },
        base.version,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      client.setQueryData(sessionKey, saved);
      setBase(saved);
      setDraft(saved);
      setMessage('Изменения сохранены.');
    } catch (cause) {
      if (controller.signal.aborted) return;
      if (cause instanceof ApiError && cause.status === 401) {
        await forget();
        return;
      }
      setNeedsReload(true);
      setError(
        cause instanceof ApiError && cause.status === 409
          ? 'Профиль изменился в другой вкладке. Ваши изменения остались в форме. Загрузите актуальный профиль перед повторным сохранением.'
          : 'Не удалось подтвердить сохранение. Ваши изменения остались в форме. Загрузите профиль, чтобы проверить результат.',
      );
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setBusy(false);
      }
    }
  }
  async function reload() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    try {
      const latest = await getProfile(controller.signal);
      if (controller.signal.aborted) return;
      if (!latest) {
        await forget();
        return;
      }
      client.setQueryData(sessionKey, latest);
      setBase(latest);
      setDraft(latest);
      setNeedsReload(false);
      setError('');
      setMessage('Актуальный профиль загружен.');
    } catch {
      if (!controller.signal.aborted) setError('Не удалось загрузить профиль. Попробуйте ещё раз.');
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <Workspace
      active="settings"
      title="Настройки аккаунта"
      description="Профиль и предпочтения для обучения."
    >
      <div className={styles.layout}>
        <nav className={styles.navigation} aria-label="Разделы настроек">
          <strong>Настройки</strong>
          <a href="#profile">Профиль</a>
          <a href="#region">Регион и время</a>
          <a href="#learning">Обучение и уведомления</a>
          <a href="#accessibility">Доступность</a>
          <a href="#appearance">Оформление</a>
          <a href="#mentor">ИИ-наставник</a>
          <p>Сохраняйте изменения перед уходом со страницы.</p>
        </nav>
        <div className={styles.content}>
          <form className={styles.panel} onSubmit={(event) => void submit(event)}>
            <h2>Профиль и интерфейс</h2>
            {env.enableMocks && (
              <p className={styles.notice}>
                Демонстрационный режим. Настройки сохраняются в этом браузере; письма не
                отправляются.
              </p>
            )}
            <ProfileSettingsFields draft={draft} busy={busy} change={change} />
            <p role="status">{message || (dirty ? 'Есть несохранённые изменения.' : '')}</p>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <div className={styles.actions}>
              {needsReload ? (
                <Button variant="outline" onClick={() => void reload()} loading={busy}>
                  Загрузить профиль и заменить изменения
                </Button>
              ) : (
                <Button
                  variant="neutral"
                  disabled={busy || !dirty}
                  onClick={() => {
                    setDraft(base);
                    setError('');
                    setMessage('Изменения отменены.');
                  }}
                >
                  Отменить изменения
                </Button>
              )}
              <Button type="submit" disabled={!dirty || needsReload} loading={busy}>
                Сохранить изменения
              </Button>
            </div>
          </form>
          <DeviceSettings />
          <AppearanceSection />
          <MentorSection />
        </div>
      </div>
    </Workspace>
  );
}
