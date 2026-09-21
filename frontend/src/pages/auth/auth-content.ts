import login from '@/assets/screens/login.png';
import register from '@/assets/screens/register.png';
import restore from '@/assets/screens/restore.png';
import reset from '@/assets/screens/reset.png';
import verify from '@/assets/screens/verify.png';
import resetDone from '@/assets/screens/reset-done.png';
import verified from '@/assets/screens/verified.png';
import invalid from '@/assets/screens/invalid.png';
export const authContent = {
  login: {
    title: 'С возвращением',
    description:
      'Продолжите с того места, где остановились. После входа вы вернётесь к своему маршруту.',
    illustration: login,
    reassurance: 'Возвращайтесь к маршруту с любого устройства',
  },
  register: {
    title: 'Учись системно и без перегруза',
    description:
      'Персональный маршрут, понятный прогресс и ИИ-наставник — всё в одном пространстве.',
    illustration: register,
    reassurance: 'ИИ-наставник поможет начать без перегруза',
  },
  restore: {
    title: 'Доступ можно восстановить',
    description: 'Введите email — мы отправим ссылку для восстановления доступа.',
    illustration: restore,
    reassurance: 'Восстановление не раскрывает существование аккаунта',
  },
  reset: {
    title: 'Создайте новый пароль',
    description: 'Придумайте новый пароль и продолжайте обучение.',
    illustration: reset,
    reassurance: 'Новый пароль — и можно продолжать обучение',
  },
  verify: {
    title: 'Почти готово',
    description: 'Подтвердите email — и продолжайте обучение с любого устройства.',
    illustration: verify,
    reassurance: 'Ссылка подтверждения защищает ваш аккаунт',
  },
  'reset-done': {
    title: 'Пароль обновлён',
    description: 'Снова войдите и продолжайте обучение с того места, где остановились.',
    illustration: resetDone,
    reassurance: 'Новый пароль уже защищает аккаунт',
  },
  verified: {
    title: 'Аккаунт готов',
    description: 'Email подтверждён. Осталось короткое знакомство с сервисом.',
    illustration: verified,
    reassurance: 'Прогресс синхронизируется между устройствами',
  },
  invalid: {
    title: 'Нужна новая ссылка',
    description: 'Эта ссылка уже недействительна. Запросите новую безопасным способом.',
    illustration: invalid,
    reassurance: 'Старые ссылки не дают доступ к аккаунту',
  },
};
export type AuthMode = keyof typeof authContent;
