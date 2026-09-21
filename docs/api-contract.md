# API: фактический снимок и открытые вопросы

Безопасность: существующий `/logout` теперь используется также с `allSessions: true` после подтверждения. Этот режим включает текущую сессию; 401 не подтверждает завершение остальных. Mock действует только в текущей вкладке. Полный экспорт и чтение статуса заявки удаления не подключены; локальный `repeat-settings.json` не является серверным архивом. [Отчёт](stage9-security-privacy.md).

Параметры обучения: preview `preferences` дополнен `responseLanguage` (`course|ru|en`), `strictness` (`gentle|balanced|strict`), `exampleFrequency` (`less|normal|more`). Defaults: `course`, `balanced`, `normal`. Языка курса в DTO нет; fallback — русский. Применение в деморежиме ограничено отдельными учебными примерами и подсказкой. [Контракт и ограничения](stage9-teaching-preferences.md). Это не согласованный backend API.

Расширенное поведение: `preferences` preview-чата дополнен boolean-полями `quickAnswers`, `useAnalogies`, `guideFirst`, `askClarifying` с default false. Снимок нормализуется перед сравнением повторного ключа; эффективные формат и подробность вычисляются отдельно и не изменяют снимок. [Приоритеты деморежима](stage9-advanced-mentor.md). Это предложение фронтенда, не согласованный контракт реального AI.

Стиль наставника: `preferences` preview-чата дополнен `tone` (`professional|friendly|concise`), `warmth`, `enthusiasm`, `structure`, `emoji` (каждый `less|default|more`). Старые записи нормализуются к `professional` и `default`. Снимок входит в проверку повторного ключа. [Поведение и ограничения](stage9-communication-style.md).

Снимок `preferences` preview-чата дополнен `suggestNext`, `checkUnderstanding`, `suggestPractice` (boolean, по умолчанию false для старых записей). Перед сравнением повторного ключа старый снимок нормализуется. [Миграция и поведение](stage9-initiative.md). Реальный контракт требует согласования с backend.

Этап 9, наставник: временный `POST /__preview/tracks/:id/tutor/threads/:thread/messages` принимает `preferences: { persona, help, detail }`; снимок возвращается в сообщениях. Поле входит в проверку повторного `Idempotency-Key`. Старые записи без поля читаются с историческими значениями. Настройки устройства не отправляются в `PATCH /me/profile`. Production guard сохранён; это не утверждённый backend-контракт. [Подробности](stage9-mentor.md).

Акцентный цвет — локальная настройка устройства (`accent` в существующей модели доступности), без нового API и без изменений `PATCH /me/profile`. [Оформление](stage9-appearance.md).

Этап 9, доступность: размер текста и уменьшение движения хранятся только на устройстве и не входят в `PATCH /me/profile`. Новых endpoints нет. [Область действия и обработка ошибок хранилища](stage9-accessibility.md).

Этап 9 (billing): добавлен изолированный `/__preview/billing` для каталога и тестовой подписки. Реальная оплата отключена, все методы имеют production guard. [Временный контракт, состояния и ограничения](stage9-billing.md). Результат оплаты приходит только из API, параметры URL не дают доступа.

Этап 9 (профиль): форма `/app/settings` использует исторический `PATCH /me/profile` с `If-Match`; поля `displayName`, `certificateName`, `timezone`, `preferredFormats`, `weeklyReminderEnabled`. `language` не отправляется: в найденном `ProfilePatchRequest` его нет. При 409 или неподтверждённой записи черновик сохраняется до явной загрузки актуальной версии; автоматических повторов нет. [Реализация и ограничения](stage9-settings.md). Совместимость с актуальным backend пока не проверена.

Этап 8: предварительные `/__preview/tracks/:id/assessments/:kind/:target` и `/__preview/tracks/:id/diploma` обеспечивают тестовые попытки, оценивание и заявку на PNG-образец. В production запрещены. [Схемы, статусы, идемпотентность и границы настоящих exams/certificates](stage8-assessments-diploma.md). Личный диплом и файлы не формируются без реального API.

Этап 7: AI-репетитор использует изолированный `/__preview/tracks/:id/tutor`; вне mocks вызовы запрещены. [DTO, идемпотентность, версии контекста и различия с историческим backend](stage7-ai-tutor.md). HTTP 202, polling/streaming и реальное хранение требуют согласования; предварительные пути не считать готовым API сервера.

Этап 6 (21.09.2026): учебные сценарии изолированы в `/__preview/tracks/*` и запрещены вне mocks. [Контракт и ограничения](stage6-learning-knowledge.md). Последний fetch: `de08e1d420239bc63bdded2355e29418e926c5f2`, исходники заменены gitlink `repeat-center` без `.gitmodules`. Актуальный контракт проверить невозможно до получения адреса вложенного репозитория/API. Даты и `12bfd8579…` ниже описывают предыдущие проверки, а не текущее дерево remote.

Этап 5 (21.09.2026): чтение программы, proposal/apply/reject/approve реализованы в изолированном mock API. [Форматы, проверки версий и границы реального контракта](stage5-plan-review.md). В production эти предварительные запросы заблокированы; существующий серверный `/plans/{plan_id}/approve` пока не подключён.

Этап 4 (21.09.2026): кабинет читает расширенную проекцию `/dashboard`; интервью и фоновые задания изолированы в предварительном `/__preview/*`, запрещённом вне mock-режима. [Точный контракт, сценарии и ограничения](stage4-courses-plans.md). Не считать эти пути существующими endpoint backend. Повторный fetch по-прежнему вернул `12bfd8579e65799117187445bd8fca508af0c43b`.

Дата статической проверки: 20.09.2026. 21.09.2026 выполнен повторный fetch: commit ветки не изменился.

## Реализация frontend этапа 3

Добавлены адаптеры декларированных AUTH-маршрутов и `GET /me/profile`. Последний используется для проверки сессии: 401 означает anonymous, остальные ошибки дают повтор запроса. Пароль и cookie не сохраняются frontend-кодом; CSRF token остаётся только в памяти, заголовок/восстановление не выдуманы. Ответы проверяются Zod, ошибки схем нормализуются в `INVALID_RESPONSE`.

Полного server-контракта онбординга нет. Для разработки изолирован **предварительный** `GET/PUT /__preview/onboarding` с `{step: 0..9, complete: boolean, values: Record<string, string | string[] | boolean>}`. Он доступен только MSW, не отправляется реальному backend и не выдаётся за согласованный API. Повтор verification email не реализован за отсутствием endpoint. Runtime интеграция и CSRF остаются блокирующими для выпуска. [Подробности и тестовые сценарии](stage3-auth-onboarding.md).

Источник: [154ajax-collab/EGE, ветка repeat-center](https://github.com/154ajax-collab/EGE/tree/repeat-center), commit [`12bfd8579e65799117187445bd8fca508af0c43b`](https://github.com/154ajax-collab/EGE/tree/12bfd8579e65799117187445bd8fca508af0c43b).

## Статус

Найдено 38 деклараций API-маршрутов. [Машиночитаемый реестр](api/source-routes.json) содержит методы, пути, operationId, коды успеха и строки исходников. Это статическое извлечение из кода, **не OpenAPI и не подтверждение работающего сервера**.

Статический разбор Python обнаружил две ошибки, которые препятствуют импорту приложения:

- [`src/api/v1/auth.py:152`](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/api/v1/auth.py#L152): `unexpected indent` после декоратора сброса пароля.
- [`src/services/auth_service.py:187`](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/services/auth_service.py#L187): `unexpected indent`.

Проверка выполнена через `ast.parse` всех `src/**/*.py`, без исполнения backend-кода, подключения к базе и установки зависимостей. Исправления backend не входят в текущую задачу. Наличие двух выявленных ошибок не означает, что других runtime-проблем нет.

Адрес тестового развёртывания не предоставлен. В коде FastAPI docs предусмотрены на `/api/docs` только при `DEBUG=true`; готового OpenAPI-файла в ветке не найдено. Схемы response часто представлены обычными dict без `response_model`, поэтому даже будущий автогенерированный OpenAPI потребует проверки полноты ответов.

## Общий транспорт

- Префикс в конфигурации: `/api/v1`. Во всех таблицах ниже он опущен.
- Основной механизм сессии: cookie `session_id`, HttpOnly в текущей конфигурации. На фронтенде использовать cookie flow с `credentials: include` после подтверждения окружения.
- Login возвращает `csrfToken`. В просмотренных маршрутах не найдена проверка CSRF-заголовка; нужно согласовать имя заголовка, защиту запросов и получение токена после перезагрузки. Нельзя считать защиту реализованной только из-за наличия поля.
- CORS по умолчанию разрешает `http://localhost:3000`, а не стандартный порт Vite 5173. Для первого запуска предлагается frontend на 3000 со строгим портом; production origins согласовать отдельно.
- `COOKIE_SECURE=false` — текущее dev-значение, не настройка production. Production cookie/domain/SameSite/CSRF требуют согласованной схемы размещения.
- Для версии ресурса используется `If-Match`, в отдельных body — `expectedVersion`/`expectedPlanVersion`. Сохранять реальные различия в адаптерах.
- Некоторые операции требуют `Idempotency-Key`, но найденные обработчики не передают его в сервис. Требование заголовка не доказывает дедупликацию: автоматические повторы таких действий пока не разрешать.
- `X-Request-Id` возвращается в заголовке и `meta.requestId`; для чтения заголовка cross-origin потребуется expose_headers либо использование body meta.

Источники: [конфигурация](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/core/config.py), [приложение](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/main.py), [зависимости сессии](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/api/dependencies.py).

## Формат ответа и ошибки

В коде успех имеет форму `{ data, meta: { requestId, timestamp, page } }`. PaginationMeta использует `next_cursor` и `has_more`; нельзя считать все вложенные поля camelCase.

Ошибка задумана как `{ error: { code, message, retryable, fieldErrors, details }, meta }`. Однако часть маршрутов оборачивает её в `HTTPException.detail`, и тогда ожидается `{ detail: { error, meta } }`. Есть также строковые `detail`. На этапе интеграции либо нормализовать эти формы в одном HTTP-адаптере, либо согласовать единый backend-формат.

В `RequestValidationError` формируются dict-элементы `field_errors`, а `error_response` вызывает у элементов `.model_dump()`. Это статически выявленное несоответствие типов; обработка ошибок полей требует исправления/проверки backend до реальной интеграции. Источник: [response.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/core/response.py) и [main.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/main.py).

Общие категории из `ErrorCode`: 400 validation; 401 auth/session; 403 access/prerequisite; 404 resource; 409 version/state/idempotency; 422 business; 429 rate limit; 502/503 dependency. Это словарь, не подтверждение наличия каждой ошибки на каждом endpoint.

Обрабатывать 204 без попытки читать JSON. Сетевую ошибку и HTML от proxy не принимать за корректный API envelope.

## Авторизация — декларации есть, импорт заблокирован синтаксисом

| Метод и путь | Body | Ответ data / HTTP |
| --- | --- | --- |
| POST `/register` | `displayName`, `email`, `password`, `consent: {termsVersion, privacyVersion, acceptedAt}` | user, verification; 201 |
| POST `/login` | `email`, `password`, необязательный `returnPath` | user, profile, csrfToken; cookie; 200 |
| POST `/password/restore-requests` | `email` | accepted, resendAfterSec; 202 |
| POST `/password/resets` | Схема: `token`, `newPassword`; тело функции повреждено | Нельзя подтвердить исполнение; схема предполагает passwordChanged/loginRequired |
| POST `/email/verifications` | `token` | user, profile; 200; автологин требует проверки |
| POST `/logout` | Схема: `allSessions=false`; функция повреждена | Заявлен 204 |

RegisterRequest: имя 1–100, email, пароль 8–128 с заглавной буквой и цифрой. ResetPasswordRequest содержит ограничение длины, но такой же валидатор сложности не найден. Повторный ввод пароля — клиентская проверка, в body не передаётся. `returnPath` есть в схеме, но обработчик login его не использует; возврат пользователя ограничивать внутренними разрешёнными маршрутами.

Не найдены отдельные маршруты повторной отправки verification email, чтения текущей сессии/CSRF, управления 2FA. `GET /me/profile` подтверждает наличие сессии, но не возвращает весь user/CSRF-контекст. Подтверждение email пытается вызвать login с пустым паролем, ловит AppError; не обещать пользователю автоматический вход.

Источник: [auth.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/api/v1/auth.py), [schemas/auth.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/schemas/auth.py).

## Кабинет, профиль и аккаунт

Все маршруты этой и последующих таблиц требуют текущего пользователя по коду зависимостей. Вся runtime-интеграция пока не проверена.

| Метод и путь | Вход | Ответ / особенности |
| --- | --- | --- |
| GET `/dashboard` | query `filter=active\|attention\|completed`, `cursor` | Данные кабинета, meta.page; cursor не используется сервисом |
| GET `/me/profile` | Без body | Профиль и version |
| PATCH `/me/profile` | `If-Match`; частичные displayName, certificateName, timezone, preferredFormats, weeklyReminderEnabled | Обновлённый профиль; конфликт версии |
| POST `/me/deletion-requests` | `confirmation: "DELETE"`, optional reason | requestId, status, requestedAt, scheduledDeletionAt, canRestoreUntil; 202 |
| POST `/me/deletion-requests/{request_id}/cancel` | password | requestId, status |

Полный набор настроек Figma, язык в PATCH, аватар, экспорт данных, сессии, 2FA и онбординг требуют дополнительных контрактов. Не подменять их одним ProfilePatchRequest.

## План

| Метод и путь | Вход | Ответ / особенности |
| --- | --- | --- |
| POST `/plan-interviews` | `source="dashboard"` | Сериализованный plan/brief/completion, version; 201 |
| GET `/plan-interviews/{interview_id}` | ID | Тот же план, brief, completion, assumptions, gaps, topics, version |
| PATCH `/plan-interviews/{interview_id}/brief` | `If-Match`; `{field, value}` | Обновлённый plan и brief |
| POST `/deadline-evaluations` | skill, targetOutcome, currentLevel, targetDate, hoursPerWeek, timezone | Оценка сроков от сервиса/AI; точную response-схему согласовать |
| POST `/plan-interviews/{interview_id}/generation-jobs` | `Idempotency-Key`; briefVersion, acceptedAssumptionIds | Job-shaped результат со status=succeeded и resourceId; 202, выполнение синхронное |
| POST `/plans/{plan_id}/approve` | `Idempotency-Key`; expectedPlanVersion, timezone, acknowledgements | track id/title/status/progressPercent/currentAction/version; 201 |

Brief fields: skill, targetOutcome, currentLevel, targetDate, hoursPerWeek, preferredFormats, constraints, acceptedRisk. В текущем handler timezone оценки и утверждения не передаётся далее в сервис.

Отдельные GET job status, GET plan, proposal/diff/apply и замена источника отсутствуют в роутерах этой ветки. Схемы PlanChangeRequestBody/PlanApplyBody есть, но наличие схемы не означает наличие endpoint. Генерация await-ится в исходном HTTP-запросе; прогресс из DRAFT пока нельзя подключить как работающую фоновую очередь.

Источник: [plans.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/api/v1/plans.py), [schemas/plan.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/schemas/plan.py).

## Обучение

| Метод и путь | Вход | Ответ / особенности |
| --- | --- | --- |
| GET `/tracks/{track_id}` | ID | track, topics, currentAction, nextDeadline, accessRulesVersion |
| GET `/tracks/{track_id}/topics/{topic_id}` | ID | topic, materials, selfCheckQuestions, examSummary, access |
| POST `/materials/{material_id}/open-events` | Без body | 204; сервис пока проверяет доступ без сохранения события |
| PUT `/materials/{material_id}/completion` | dict: completed, expectedVersion | material, topicSummary, trackProgress, examAccess |
| GET `/tracks/{track_id}/stats` | query from_date, to_date | Статистика; фильтры дат пока не передаются сервису |

`selfCheckQuestions` в сервисе возвращается пустым массивом. Иерархию модулей/тем из Figma сверить с фактической моделью: ответ track содержит плоский список topics. Источник: [learning_service.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/services/learning_service.py).

## Экзамены

| Метод и путь | Вход | Ответ / особенности |
| --- | --- | --- |
| GET `/exams/{exam_id}` | ID | Условия и допуск из ExamService |
| POST `/exams/{exam_id}/attempts` | `Idempotency-Key`; resumeIfActive=true | Попытка; строгая response-схема отсутствует |
| PUT `/exam-attempts/{attempt_id}/answers/{question_id}` | `If-Match`; dict ответа | Результат сохранения; типы ответа согласовать |
| POST `/exam-attempts/{attempt_id}/submit` | `Idempotency-Key`; expectedVersion | Результат проверки сервиса; 202, оценивание сейчас синхронное |
| GET `/exam-attempts/{attempt_id}` | ID | Результат/состояние попытки |

Формат вопросов и вариантов, таймер, сохранение незавершённой попытки и ответы разных типов должны получить строгие схемы до подключения. Не переносить универсальные `/checkpoints` и `/attempts` из DRAFT вместо этих реальных путей. Источник: [exams.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/api/v1/exams.py).

## AI-репетитор

| Метод и путь | Вход | Ответ / особенности |
| --- | --- | --- |
| POST `/chat-threads` | purpose=tutor | id, purpose, contextVersion; 201 |
| PATCH `/chat-threads/{thread_id}/context` | topicId, materialId, expectedContextVersion | id, contextVersion |
| POST `/chat-threads/{thread_id}/messages` | `Idempotency-Key`; text, contextVersion, clientMessageId | run id, userMessageId, assistantMessageId, status, contextVersion; 202 |
| GET `/chat-threads/{thread_id}/messages` | cursor | messages, hasMore, nextCursor; пагинация пока фактически не реализована |
| POST `/chat-threads/{thread_id}/actions/summarize` | materialId, contextVersion | run/assistantMessageId |
| POST `/chat-threads/{thread_id}/actions/practice` | topicId, difficulty, questionCount, contextVersion | practice id, status, questions и состояние; mock-вопросы |
| POST `/chat-messages/{message_id}/feedback` | rating, reasonCode, comment | 204; сервис не сохраняет feedback |

Сообщение ожидает AI внутри запроса. SSE/WebSocket не обнаружены. Роут создания thread не передаёт trackId, хотя у сервиса такой параметр есть. Это блокирует подтверждение контекстного чата курса; требуется уточнение. `clientMessageId` передаётся, но в просмотренном send_message не используется для дедупликации.

Источники: [tutor.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/api/v1/tutor.py), [tutor_service.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/services/tutor_service.py).

## Дипломы

| Метод и путь | Вход | Ответ / особенности |
| --- | --- | --- |
| POST `/tracks/{track_id}/certificate-generation-jobs` | `Idempotency-Key`; finalAttemptId, profileVersion, templateVersion, legalTextVersion | job id/type/status/resourceId; 202 |
| GET `/certificates/{cert_id}` | ID | certificateName, skillName, status, issueDate, documentNo, previewUrl, downloadAvailable, версии |
| POST `/certificates/{cert_id}/download-links` | `Idempotency-Key`; dict body | url и данные ссылки сервиса |
| GET `/certificates` | Без body | items: id, status, skillName, issueDate, documentNo |

MockRendererAdapter сейчас не создаёт PNG, а ссылка скачивания содержит mock-подпись. Экран можно собрать на fixtures, но реальный выпуск/скачивание не подтверждены. Источник: [renderer_adapter.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/adapters/renderer_adapter.py), [certificate_service.py](https://github.com/154ajax-collab/EGE/blob/12bfd8579e65799117187445bd8fca508af0c43b/src/services/certificate_service.py).

## Отсутствующие контракты относительно Figma

| Область | Что требуется |
| --- | --- |
| Общая база знаний | knowledgeUnitId, aliases, общий mastery/evidence, связи курсов, поиск, источники, review |
| Research | Получение этапов и статуса, sources, повтор и частичный результат |
| Plan review | Получение плана, proposal/diff/apply, замена источника, конфликты |
| Проекты | Требования, черновик, файлы, версии попыток, отправка, проверка, доработка |
| Billing | Тарифы, права, checkout, подтверждение/отмена подписки и история |
| Настройки | Большинство секций за пределами базового профиля |
| Онбординг | Состояние прохождения и настройки AI-наставника |
| Авторизация | Синтаксис, текущая сессия и CSRF, resend, окончательный flow verification |

Общая база знаний из Figma не равна отдельной базе трека из DRAFT. Решение о канонической модели должен подтвердить backend-разработчик/владелец продукта. До этого не выдавать межкурсовое переиспользование за готовую возможность.

## Порядок снятия зависимостей

1. Исправить импорт backend и получить тестовый адрес либо полноценный OpenAPI с response-схемами.
2. Зафиксировать сессию, CSRF, формат ошибок и CORS — это нужно для первой интеграции входа.
3. Подтвердить минимальный договор для интервью/генерации/утверждения и сохранения прогресса.
4. Затем согласовать отсутствующие разделы, версии, фоновые задания и дедупликацию.

Эти пункты подготовлены для совместного обсуждения. Сообщения разработчику и изменения его репозитория не выполнялись. Фронтенд-основа, дизайн-система и экраны с явно обозначенными mocks могут разрабатываться уже сейчас.
