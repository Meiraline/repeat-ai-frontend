import type { PreferenceField, PreferenceValues } from '@/components/organisms/OnboardingForm';
import profile from '@/assets/screens/onboard-mentor.png';
import intro from '@/assets/screens/onboard-intro.png';
import courses from '@/assets/screens/onboard-courses.png';
import schedule from '@/assets/screens/onboard-schedule.png';
import mentor from '@/assets/screens/onboard-mentor.png';
import analytics from '@/assets/screens/onboard-analytics.png';
import knowledge from '@/assets/screens/onboard-knowledge.png';
import exams from '@/assets/screens/onboard-exams.png';
import diploma from '@/assets/screens/onboard-diploma.png';
import complete from '@/assets/screens/onboard-complete.png';
import vector from '@/assets/screens/mentor-vector.png';
import lira from '@/assets/screens/mentor-lira.png';
import cypher from '@/assets/screens/mentor-cypher.png';
import astra from '@/assets/screens/mentor-astra.png';
const choices = (items: string[]) => items.map((label) => ({ value: label, label }));
const option = (
  key: string,
  label: string,
  items: string[],
  multiple = false,
): PreferenceField => ({ key, label, options: choices(items), multiple });
export const defaultPreferences: PreferenceValues = {
  displayName: '',
  address: 'Без разницы',
  theme: 'Светлая',
  accent: 'Синий',
  density: 'Стандартно',
  motion: 'Включены',
  sort: 'По ближайшему занятию',
  courseCard: ['Следующее занятие', 'Прогресс курса', 'Ближайший дедлайн', 'Риск отставания'],
  archive: 'Переносить в архив',
  minutes: '45 мин',
  days: ['Пн', 'Ср', 'Пт'],
  time: ['Вечером'],
  reminder: 'За 1 час',
  missed: 'Перестроить план',
  mentor: 'Вектор',
  tone: 'Профессиональный',
  warmth: 'По умолчанию',
  enthusiasm: 'Менее',
  structure: 'По умолчанию',
  emoji: 'По умолчанию',
  answers: 'Объяснение + пример',
  quick: 'Включены',
  suggestions: 'Включены',
  metrics: ['Прогресс по плану', 'Регулярность занятий', 'Результаты практики', 'Слабые темы'],
  comparison: 'С собой за прошлый период',
  formats: ['Видео'],
  sources: ['YouTube', 'Stepik', 'Coursera', 'Документация'],
  excluded: '',
  difficulty: 'Стандартная',
  frequency: 'Каждый модуль',
  attempts: '2',
  review: 'После всех попыток',
  certificateName: '',
  certificateFields: ['Итоговый результат', 'Дата завершения', 'Продолжительность курса'],
};
type Step = {
  title: string;
  description: string;
  illustration: string;
  formTitle: string;
  formDescription?: string;
  fields: PreferenceField[];
};
export const onboardingSteps: Step[] = [
  {
    title: 'Давайте познакомимся',
    description:
      'Расскажите, как к вам обращаться, и выберите предпочтения. Всё можно изменить позже.',
    illustration: profile,
    formTitle: 'Настроим ваш профиль',
    formDescription: 'Базовые параметры аккаунта — без привязки к конкретному курсу.',
    fields: [
      {
        key: 'displayName',
        label: 'Как вас называть',
        required: true,
        hint: 'Это имя будет использоваться в интерфейсе и обращениях ИИ-наставника.',
      },
      option('address', 'Форма обращения', ['На ты', 'На вы', 'Без разницы']),
      {
        ...option('theme', 'Тема интерфейса', ['Светлая', 'Тёмная', 'Как в системе']),
        disabled: true,
        hint: 'Сейчас доступна светлая тема.',
      },
      { ...option('accent', 'Основной цвет', ['Синий', 'Фиолетовый', 'Зелёный']), disabled: true },
      {
        ...option('density', 'Плотность интерфейса', ['Компактно', 'Стандартно', 'Свободно']),
        disabled: true,
      },
      option('motion', 'Анимации и эффекты', ['Включены', 'Выключены']),
    ],
  },
  {
    title: 'Настроим сервис под вас',
    description:
      'Познакомьтесь с основными возможностями Репит.центра и задайте настройки по умолчанию.',
    illustration: intro,
    formTitle: 'Как устроено обучение',
    formDescription:
      'Перед первым курсом — короткое знакомство. Эти настройки станут значениями по умолчанию.',
    fields: [],
  },
  {
    title: 'Каждая цель — отдельный курс',
    description:
      'Курс — самостоятельный учебный проект со своей целью, сроком, программой, базой знаний и прогрессом.',
    illustration: courses,
    formTitle: 'Как показывать ваши курсы',
    fields: [
      option('sort', 'Сортировка на главной', [
        'По ближайшему занятию',
        'По прогрессу',
        'По дате создания',
      ]),
      option(
        'courseCard',
        'Что показывать на карточке курса',
        ['Следующее занятие', 'Прогресс курса', 'Ближайший дедлайн', 'Риск отставания'],
        true,
      ),
      option('archive', 'Завершённые курсы', ['Переносить в архив', 'Оставлять на главной']),
    ],
  },
  {
    title: 'План подстраивается под ваш график',
    description:
      'После создания курса AI разбивает цель на модули, темы, практику и контрольные точки. План можно пересчитать без потери прогресса.',
    illustration: schedule,
    formTitle: 'Ваш учебный ритм по умолчанию',
    fields: [
      option('minutes', 'Сколько времени удобно заниматься в день', [
        '15 мин',
        '30 мин',
        '45 мин',
        '60 мин',
        '90+ мин',
      ]),
      option('days', 'Предпочтительные дни', ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], true),
      option('time', 'Когда удобнее заниматься', ['Утром', 'Днём', 'Вечером', 'Неважно'], true),
      option('reminder', 'Напоминать о занятии', [
        'За 15 минут',
        'За 1 час',
        'Утром в день занятия',
        'Не напоминать',
      ]),
      option('missed', 'Если занятие пропущено', ['Перестроить план', 'Спросить меня']),
    ],
  },
  {
    title: 'Наставник знает, что вы изучаете',
    description:
      'ИИ-наставник видит текущую тему, учебный план, материалы и предыдущие ошибки. Он может объяснить иначе, дать пример или предложить практику.',
    illustration: mentor,
    formTitle: 'Выберите своего наставника',
    formDescription:
      'Персонализация меняет форму общения, но не качество знаний и доступные функции ИИ.',
    fields: [
      {
        key: 'mentor',
        label: 'Выберите персонажа',
        options: [
          { value: 'Вектор', label: 'Вектор', image: vector },
          { value: 'Лира', label: 'Лира', image: lira },
          { value: 'Сайфер', label: 'Сайфер', image: cypher },
          { value: 'Астра', label: 'Астра', image: astra },
        ],
      },
      option('tone', 'Базовый стиль и тон', ['Профессиональный', 'Дружелюбный', 'Краткий']),
      ...['warmth', 'enthusiasm', 'structure', 'emoji'].map((key, i) =>
        option(key, ['Тёплый', 'Восторженный', 'Заголовки и списки', 'Эмодзи'][i]!, [
          'Менее',
          'По умолчанию',
          'Более',
        ]),
      ),
      option('answers', 'Как давать ответы', [
        'Сначала подсказка',
        'Объяснение + пример',
        'Можно сразу решение',
      ]),
      option('quick', 'Быстрые ответы', ['Включены', 'Выключены']),
      option('suggestions', 'Предлагаемые подсказки', ['Включены', 'Выключены']),
    ],
  },
  {
    title: 'Прогресс — это не только проценты',
    description:
      'Сервис показывает выполнение плана, регулярность, результаты практики, слабые темы и прогноз завершения курса.',
    illustration: analytics,
    formTitle: 'Что показывать в первую очередь',
    formDescription: 'Отметьте показатели, которые хотите видеть на главном экране аналитики.',
    fields: [
      option(
        'metrics',
        'Показатели',
        [
          'Прогресс по плану',
          'Время обучения',
          'Регулярность занятий',
          'Результаты практики',
          'Результаты экзаменов',
          'Слабые темы',
          'Прогноз завершения',
          'Серия дней без пропусков',
        ],
        true,
      ),
      option('comparison', 'Сравнение', ['С собой за прошлый период', 'Только текущее состояние']),
    ],
  },
  {
    title: 'Материалы — в единой базе знаний',
    description:
      'Для каждой темы сервис хранит связанные материалы, понятия, вопросы и источники. Источник всегда можно открыть и проверить.',
    illustration: knowledge,
    formTitle: 'Какие материалы вам удобнее',
    fields: [
      option(
        'formats',
        'Предпочитаемые форматы',
        ['Видео', 'Статьи', 'Интерактивные материалы', 'Аудио', 'PDF / книги'],
        true,
      ),
      option(
        'sources',
        'Предпочтительные источники',
        ['YouTube', 'Stepik', 'Coursera', 'Документация'],
        true,
      ),
      { key: 'customSources', label: 'Другие источники', hint: 'Сайты или домены через запятую.' },
      {
        key: 'excluded',
        label: 'Не использовать',
        hint: 'Добавьте сайт, домен или тип источника. Приоритет формата не заставляет AI использовать неподходящий источник.',
      },
    ],
  },
  {
    title: 'Проверка показывает, усвоена ли тема',
    description:
      'Контрольные точки могут включать тесты, открытые ответы и практические задания. По результату сервис предлагает следующий этап или повторение.',
    illustration: exams,
    formTitle: 'Как вас проверять',
    fields: [
      option('difficulty', 'Сложность', ['Мягкая', 'Стандартная', 'Строгая']),
      option('frequency', 'Как часто', [
        'Каждый модуль',
        'Через несколько тем',
        'Только ключевые этапы',
      ]),
      option('attempts', 'Количество попыток', ['1', '2', '3', 'Без ограничения']),
      option('review', 'Когда показывать разбор', ['После каждой попытки', 'После всех попыток']),
    ],
  },
  {
    title: 'Завершённый курс остаётся с вами',
    description:
      'После программы и финальной контрольной точки диплом сохраняется в профиле и остаётся доступным для скачивания.',
    illustration: diploma,
    formTitle: 'Как подписать диплом',
    formDescription: 'Укажите имя так, как оно должно выглядеть в документе.',
    fields: [
      {
        key: 'certificateName',
        label: 'Имя на дипломе',
        required: true,
        hint: 'Порядок слов сохранится.',
      },
      option(
        'certificateFields',
        'Показывать в дипломе',
        ['Итоговый результат', 'Дата завершения', 'Продолжительность курса'],
        true,
      ),
    ],
  },
  {
    title: 'Всё готово к первому курсу',
    description:
      'Общие предпочтения сохранены. Настройки каждого курса можно менять независимо от остальных.',
    illustration: complete,
    formTitle: 'Настройки сохранены',
    fields: [],
  },
];
