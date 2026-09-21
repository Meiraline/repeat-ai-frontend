# repeat.ai — frontend

Этап 8: `/app/tracks/:id/exam/:topic`, `/app/tracks/:id/project`, `/app/tracks/:id/diploma`, `/app/diplomas`. После изучения материалов доступен экзамен, после всех тем — проект и заявка на диплом. Только mocks; скачивание выдаёт PNG-образец, а не персональный документ. [Проверка и ограничения](../docs/stage8-assessments-diploma.md).

Этап 7: `/app/tutor` — выбор курса, `/app/tracks/:id/tutor` — диалоги. Из урока доступно «Спросить репетитора». История и восстановление работают в mock-режиме; реальный AI не подключён. [Проверка и контракт](../docs/stage7-ai-tutor.md).

Этап 6: доступны карта `/app/tracks/:id`, урок `/app/tracks/:id/topics/:topic`, база курса `/app/tracks/:id/knowledge` и общая база `/app/knowledge`. Переход в обучение — после утверждения программы. Данные пока демонстрационные, реальный API не подключён. [Сценарий проверки и ограничения](../docs/stage6-learning-knowledge.md).

React 19 + TypeScript + Vite + React Router Framework Mode. Node.js 24.14+ (ветка 24), npm; версии зависимостей закреплены в `package-lock.json`.

## Запуск

```powershell
cd frontend
npm ci
npm run dev:mock
```

Открыть http://127.0.0.1:3000/auth/login. Тестовый вход: `student@example.test` / `Repeat123`. `/` — предварительный публичный экран; `/app` и `/app/courses` — кабинет; `/onboarding` — знакомство и предпочтения. `/app/plans/new` — создание плана, `/app/plans/:id` — сохранённое интервью и статус генерации. Mocks обозначены полосой; реальные письма не отправляются. [AUTH](../docs/stage3-auth-onboarding.md), [кабинет, создание плана и сценарии QA](../docs/stage4-courses-plans.md). Утверждение программы и обучение относятся к следующим этапам.

Этап 2: компоненты Figma и демонстрация формы доступны через `npm run storybook` → http://127.0.0.1:6006/?path=/story/design-system-auth-foundations--auth-composition. Каталог, источники и правила использования: [дизайн-система](../docs/design-system.md). Команда `npm run test:storybook` проверяет взаимодействия в Chromium, Firefox, WebKit и на 320 px; ручной Storybook перед ней нужно остановить.

`npm run dev:mock` явно включает MSW. `npm run dev` работает с настоящим API: скопировать `.env.example` в `.env.local`, задать `API_PROXY_TARGET=http://127.0.0.1:8000` для локального прокси. Путь по умолчанию — `/api/v1`. Для отдельного API origin настроить `VITE_API_BASE_URL`, CORS с credentials и cookie на backend. Cookie HttpOnly читает сервер; frontend отправляет `credentials: include`. В `VITE_*` нельзя помещать секреты. Для проверки CORS использовать настоящий origin браузера; dev-прокси CORS не проверяет.

## Команды

| Команда                                          | Назначение                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `npm run check`                                  | Типы, границы модулей, форматирование, unit-тесты, production build |
| `npm run storybook`                              | Каталог начальных компонентов, порт 6006                            |
| `npm run build-storybook`                        | Статическая сборка каталога                                         |
| `npx playwright install chromium firefox webkit` | Установка тестовых движков один раз                                 |
| `npm run test:e2e`                               | Проверки dev/mocks в трёх движках и узких viewport                  |
| `npm run test:e2e:production`                    | Проверки готовой сборки; сначала `npm run build`                    |
| `npm run preview`                                | Локальная проверка production, порт 4173                            |

## Структура

Все пути ниже относительно `frontend/`; общий backend остаётся в корневом `src/` репозитория.

```text
src/
  app/             # entry, документ, routes, providers, глобальный CSS
  pages/           # экраны, связывающие UI и features
  components/      # quarks → atoms → molecules → organisms → templates
  features/        # API-адаптеры, схемы, состояние по бизнес-возможностям
  shared/          # HTTP transport, ошибки, конфигурация, общие утилиты
  design-tokens/   # семантические CSS variables
  mocks/           # только dev: MSW handlers и fixtures
tests/             # браузерные проверки и setup
.storybook/        # отдельная конфигурация без роутера приложения
scripts/           # проверка build и локальный preview
```

Пустые уровни Atomic Design создаются при появлении первого компонента. Компоненты не импортируют features/API; страницы используют публичный `features/<name>/index.ts`; shared не зависит от UI. ESLint проверяет направления импортов. Внутри компонента — `.tsx`, `.module.css`, при необходимости `.stories.tsx`. Тесты логики расположены рядом с ней. Подробности: [правила](../ии-хелперы/ПРАВИЛА-РАЗРАБОТКИ.md), [архитектура](../docs/architecture.md).

## API и ошибки

`shared/api/client.ts` возвращает `unknown` из envelope `data`; feature проверяет payload через Zod. Поддержаны top-level error и FastAPI `detail.error`, 204, отмена, timeout. HTTP-клиент не повторяет запросы автоматически. Query допускает один повтор явно retryable GET при сетевой/серверной ошибке; mutations не повторяются. Очистка session-cache и auth guard реализованы. `/app` требует успешной проверки профиля; реальную защиту данных обеспечивает API. Запрос сессии не повторяется автоматически.

## Production и хостинг

Этап 5: `/app/plans/:id/review` — просмотр, сравнение правок и утверждение программы с mocks. [Сценарий проверки и предварительный API](../docs/stage5-plan-review.md). Этот маршрут также требует SPA fallback на хостинге.

Размещать `build/client`. Для `/` отдавать `index.html`; для `/app`, `/app/courses`, `/app/plans/new`, `/app/plans/:id`, `/onboarding`, реализованных `/auth/*` и `/legal/*` — `__spa-fallback.html`; неизвестным страницам отдавать этот fallback со статусом 404; отсутствующим assets — 404. `/api/*` направлять на backend, не на HTML. Точный список маршрутов зафиксирован в `scripts/preview.mjs`; его локальный API возвращает 503.

MSW worker обслуживается только dev-сервером в mock-режиме и отсутствует в production. Сборка с `VITE_ENABLE_MOCKS=true` запрещена. `verify-build.mjs` проверяет prerender и отсутствие MSW. После перехода dev-origin из mock-режима frontend удаляет только свой mock worker.

Реальная интеграция ожидает исправления backend и тестовый API: [контракт](../docs/api-contract.md). Канонический домен, sitemap, полный лендинг, финальные шрифты и проверка реальных устройств — последующие этапы.
