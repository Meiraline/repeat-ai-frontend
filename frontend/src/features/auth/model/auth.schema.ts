import { z } from 'zod';

export const emailSchema = z.string().trim().email('Укажите корректный email.');
export const passwordSchema = z
  .string()
  .min(8, 'Минимум 8 символов.')
  .max(128, 'Максимум 128 символов.')
  .regex(/\p{Lu}/u, 'Добавьте заглавную букву.')
  .regex(/\p{Nd}/u, 'Добавьте цифру.');
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Введите пароль.'),
});
export const registerSchema = z.object({
  displayName: z.string().trim().min(1, 'Укажите имя.').max(100, 'Максимум 100 символов.'),
  email: emailSchema,
  password: passwordSchema,
  consent: z.literal(true, { error: 'Необходимо согласие с условиями и политикой.' }),
});
export const resetSchema = z
  .object({ newPassword: passwordSchema, confirmation: z.string() })
  .refine((v) => v.newPassword === v.confirmation, {
    path: ['confirmation'],
    message: 'Пароли не совпадают.',
  });
export const profileSchema = z.object({
  displayName: z.string(),
  certificateName: z.string().nullable(),
  timezone: z.string(),
  language: z.string(),
  preferredFormats: z.array(z.string()),
  weeklyReminderEnabled: z.boolean(),
  version: z.number().int(),
});
export type Profile = z.infer<typeof profileSchema>;

export const profilePatchSchema = z.object({
  displayName: z.string().trim().min(1, 'Укажите имя.').max(100, 'Максимум 100 символов.'),
  certificateName: z.string().trim().max(100, 'Максимум 100 символов.').nullable(),
  timezone: z.string().refine((value) => {
    try {
      new Intl.DateTimeFormat('ru', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, 'Выберите часовой пояс.'),
  preferredFormats: z.array(
    z.enum(['video', 'audio', 'article', 'official_document', 'interactive']),
  ),
  weeklyReminderEnabled: z.boolean(),
});
export type ProfilePatch = z.infer<typeof profilePatchSchema>;

// Restrict return paths to implemented private routes; never navigate to an external origin.
export function safeReturnPath(value: string | null | undefined) {
  if (!value || value.includes('\\') || [...value].some((char) => char.charCodeAt(0) <= 32))
    return '/app';
  try {
    const url = new URL(value, 'https://repeat.invalid');
    if (!value.startsWith('/') || value.startsWith('//') || url.origin !== 'https://repeat.invalid')
      return '/app';
    return [
      '/app',
      '/app/courses',
      '/app/knowledge',
      '/app/tutor',
      '/app/diplomas',
      '/app/settings',
      '/app/billing',
      '/app/billing/checkout',
      '/app/billing/return',
      '/onboarding',
      '/app/plans/new',
    ].includes(url.pathname) ||
      /^\/app\/tracks\/[a-zA-Z0-9-]+(?:\/knowledge|\/tutor|\/project|\/diploma|\/(?:topics|exam)\/[a-zA-Z0-9-]+)?$/.test(
        url.pathname,
      ) ||
      /^\/app\/plans\/[a-zA-Z0-9-]+(?:\/review)?$/.test(url.pathname)
      ? url.pathname + url.search
      : '/app';
  } catch {
    return '/app';
  }
}
