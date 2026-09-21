# Карта Figma и фронтенда

Безопасность `5697:26469` → `pages/settings/SecuritySection`; приватность `5292:17520` → `PrivacySection`. Используются существующие Button/Dialog и общая адаптивная компоновка. Контракт поддерживает выход из **всех**, включая текущую, сессий; локальная копия настроек добавлена отдельно от неподключённого полного архива. Остальные серверные функции явно обозначены как недоступные. [Детали](stage9-security-privacy.md).

Язык ответов, требовательность, частота примеров `6043:13404` → три select в расширенном поведении `MentorSettingsFields`. Начальные значения соответствуют закрытым спискам макета; дополнительные варианты и поведение — решения для демонстрации. [Отчёт](stage9-teaching-preferences.md).

Быстрые ответы и расширенное поведение `6043:13404` → `MentorSettingsFields`: четыре переключателя на существующих Checkbox. Описания уточняют границы деморежима. Язык, требовательность и частота примеров пока не реализованы. [Отчёт](stage9-advanced-mentor.md).

Стиль общения `6043:13404` → группа в `components/organisms/MentorSettingsFields`: тон, теплота, эмоциональность, структура и эмодзи. Адаптивная сетка подписанных нативных списков вместо визуальных dropdown-компонентов макета. [Отчёт](stage9-communication-style.md).

Инициативность `6043:13404` → группа в `components/organisms/MentorSettingsFields`: следующий вопрос, проверка понимания, практика. Нативные checkbox с существующим оформлением вместо новых toggle; адаптивная вертикальная компоновка. [Отчёт](stage9-initiative.md).

Этап 9, наставник: `6043:13404` → `pages/settings/MentorSection` + `components/organisms/MentorSettingsFields`. Переиспользованы оригинальные PNG наставников из этапа 3. Карточка настроек вместо отдельного экрана; реализованы персонаж, формат и подробность. [Адаптация и открытые части](stage9-mentor.md).

Этап 9, оформление: `5292:16134` → `pages/settings/AppearanceSection` + `components/organisms/AppearanceSettings`. Три акцентных цвета и предпросмотр; светлая тема. [Цветовые адаптации и ограничения](stage9-appearance.md).

Этап 9, доступность: `5292:16134` → `pages/settings/DeviceSettings` + `components/organisms/AccessibilitySettings`. Подтверждены размер текста и уменьшение движения; отдельная карточка настроек устройства, без имитации темы и контрастности. [Описание адаптации](stage9-accessibility.md).

Billing, этап 9: `6665:14919` → `pages/billing/BillingPage`, molecule `PricingCard` (исходная карточка `7227:17263`); `6665:15010` → `BillingCheckout`; `6665:15101` и `6665:15283` → `BillingReturn` и панель текущей подписки. Design context получен для всех четырёх экранов. API/состояния — `features/billing`. Отличия: единая панель подписки, поля карты заменены симуляцией до подключения провайдера, настройки в локальном меню ограничены реализованными разделами. [Подробности](stage9-billing.md).

## Этап 8 — экзамены, проект, диплом

| Узел Figma | Реализация |
| --- | --- |
| `5328:18777` — прохождение | `pages/exam/ExamPage`, `components/organisms/ExamQuestion` |
| `5329:19274` — результат | `pages/exam/ExamPage`, демонстрационная обратная связь |
| `5382:22363` — сдача проекта | `pages/project/ProjectPage`, общий механизм попыток, отдельная форма |
| `5321:17780` — имя | `pages/diploma/DiplomaPage`, фиксация имени в заявке |
| `5321:18110` — просмотр | `pages/diploma/DiplomaPage`, скачивание незаполненного PNG-образца |

[Экспорт PNG](figma/stage8-assets.json), [ограничения и QA](stage8-assessments-diploma.md). Полный rubric-разбор, вложения, персональный документ и дополнительные состояния не завершены.

## Этап 7 — AI-репетитор

`5368:21912` → `pages/tutor/TutorPage`, `components/molecules/TutorMessage`, существующие `LearningContent` и `Workspace`. Реализован основной чат в трёх колонках с последовательным мобильным представлением. `pages/tutor/TutorIndex` даёт выбор курса. Источники — ссылки под ответом; Drawer, вложения и дополнительные action cards не завершены. [Ограничения](stage7-ai-tutor.md), [экспортированные изображения](figma/stage7-assets.json).

## Этап 5 — согласование программы

| Figma node | Реализация |
| --- | --- |
| `5361:21732` | `pages/plan-review/PlanReviewPage`, `PlanReviewProgram` |
| `7619:21629` | `PlanDiffRow`, широкий вариант `Dialog` |
| `7619:21822` | Подтверждение параметров и пробелов в источниках |
| `5361:21892` | Результат утверждения и переход к активному курсу |

Все четыре узла прочитаны через `get_design_context`; Figma не изменялась. [Отчёт и отличия](stage5-plan-review.md), [assets](figma/stage5-assets.json).

## Этап 4 — кабинет и создание плана

| Figma node | Реализация |
| --- | --- |
| `5292:15469`, `5292:15869` | `pages/courses/CoursesPage`, `CourseCard`, `DeadlineCalendar`, `AppShell` |
| `5355:20457`, `5355:20796` | `pages/plan-create/PlanCreatePage`, `InterviewForm`, `PlanIllustration` |
| `5355:21151`, `5355:21481`, `5355:21842` | Проверка срока, сводка и генерация на странице создания; `ProgressBar` |

Источники, адаптация и неподключённые действия: [отчёт этапа 4](stage4-courses-plans.md). [Реестр assets](figma/stage4-assets.json). Исследованы design context всех семи экранов; Figma не изменялась.

Снимок: 20.09.2026. Файл `hvF90E8EGKFYvS1FxAgSvQ`, страница [Прототип Десктоп MVP, 454:23737](https://www.figma.com/design/hvF90E8EGKFYvS1FxAgSvQ/repeat.ai?node-id=454-23737).

## Объём и достоверность

Получена структура всей указанной страницы: 8613 узлов метаданных. В карте сервиса выделены 17 процессных/системных секций, 113 узлов `SCR-*` и 159 модальных окон, оверлеев и состояний. Эти числа описывают именованные узлы дизайна, а не количество маршрутов приложения.

Подробный [реестр экранов и компонентов](figma/screen-component-inventory.md) содержит ID, ссылки и размеры. [JSON-снимок](figma/inventory.json) сохраняет выбранные узлы для последующих сверок. Реестр включает 335 кандидатов компонентов с префиксами Atomic Design; в нём возможны группы, вложенные компоненты и legacy-замены. Это не требование создать 335 React-компонентов.

Визуально и через design context проверен экран входа `5673:81`. Для формы входа `7495:18063` и набора кнопок `2425:264` получены токены. Остальные экраны пока инвентаризированы структурно; полная визуальная проверка, свойства экземпляров и связи прототипа уточняются перед реализацией каждого сценария.

На этапе 2 дополнительно проверены design context и изображения Input, Button, Checkbox, TextLink, IconButton, Spinner, Typography, Icon и ConsentRow. Первый набор AUTH реализован в `frontend/src/components/`. Точное соответствие путей узлам и особенности адаптации — в [дизайн-системе](design-system.md); исходные экспорты — в [реестре assets](figma/stage2-assets.json). Таблицы будущих маршрутов ниже остаются планом, а не перечнем готовых экранов.

## Предложение маршрутов

Этап 3 (21.09.2026): реализованы `AuthTemplate` ← `7499:18266`, общий `AuthForm` ← формы `7495:18009/18063/18098/18124`, `Dialog` ← `7496:18725`, статусы ← `5673:6/297/372/447`, `OnboardingForm` и страницы ← десять SCR из секции ONBOARDING, `AppShell` ← оболочка `5292:15869`. Оригинальные illustrations/logo/mentor assets: [реестр](figma/stage3-assets.json). Вместо отдельного компонента на каждый шаг используется общий организм с типизированными полями. [Отличия и ограничения](stage3-auth-onboarding.md).

URL ниже — проектное решение фронтенда. Это не endpoints API и не утверждение, что такие маршруты уже реализованы. Промежуточные состояния одного сценария не должны обязательно становиться самостоятельными страницами.

| Раздел Figma / ID | Предлагаемые URL | Код | Адаптация |
| --- | --- | --- | --- |
| Лендинг / `5591:223968` | `/` | `pages/landing` | Последовательные секции; HTML при сборке |
| AUTH / `5257:14991` | `/auth/login`, `/auth/register`, `/auth/restore`, `/auth/reset`, `/auth/verify` | `pages/auth`, `features/auth` | Одна форма; декор необязателен |
| ONBOARDING / `5775:29883` | `/onboarding` | `pages/onboarding`, `features/onboarding` | Один шаг; выбранные настройки сохраняются |
| COURSES / `5292:15436` | `/app/courses`, фильтр архива в query | `pages/courses`, `features/courses` | В Figma указано desktop 2–3 карточки, tablet 2, mobile 1 |
| PLAN-CREATE / `5355:20405` | `/app/plans/new`, `/app/plan-interviews/:interviewId` | `pages/plan-create`, `features/plans` | Интервью, риск и сводка последовательно |
| PLAN-EDIT / `5361:21685` | `/app/plans/:planId/review` | `pages/plan-review`, `features/plans` | Diff последовательно, подтверждение доступно |
| LEARN / `6363:13044` | `/app/tracks/:trackId`, `/app/tracks/:trackId/stats`, `/app/tracks/:trackId/topics/:topicId` | `pages/learn`, `features/learning` | Roadmap списком; детали через панели |
| KNOWLEDGE / `5407:24161` | `/app/knowledge`, `/app/tracks/:trackId/knowledge` | `pages/knowledge`, `features/knowledge` | Список → детали; общий и курсовой контекст различаются |
| TUTOR / `5368:21875` | `/app/tracks/:trackId/tutor` и встроенная панель | `pages/tutor`, `features/tutor` | Ввод доступен при открытой клавиатуре |
| EXAM / `5327:18469` | `/app/exams/:examId`, `/app/exam-attempts/:attemptId` | `pages/exam`, `features/assessments` | Вопрос и действия в одной колонке |
| PROJECT / `5382:22144` | `/app/projects/:projectId`, `/app/project-attempts/:attemptId` | `pages/project`, `features/assessments` | Требования и сдача последовательно; API ещё не найден |
| DIPLOMA / `5321:17734` | `/app/diplomas`, `/app/diplomas/:certificateId` | `pages/diploma`, `features/diplomas` | Превью вписывается; исходный PNG доступен отдельно |
| SETTINGS / `6004:13437` | `/app/settings/:section` | `pages/settings`, `features/settings` | В Figma прямо указаны отдельные экраны категорий на mobile |
| BILLING / `6665:14890` | `/app/billing`, `/app/billing/checkout`, `/app/billing/return` | `pages/billing`, `features/billing` | Тарифы последовательно; статус оплаты с сервера |
| LEGAL / `6304:13859` | `/legal/terms`, `/legal/privacy` | `pages/legal` | Читаемая колонка |
| SYSTEM-STATES / `5678:22688` | Catch-all и состояния текущего маршрута | Общие компоненты и error boundary | Сохраняются причина и путь восстановления |
| SYSTEM-RESEARCH / `5382:23284` | Внутри создания плана | `features/plans` | Этапы вертикально; отдельный публичный маршрут не нужен |
| SYSTEM-FLOW / `6585:13498` | Маршрут не создаётся | Документация связей | Сквозной путь, а не экран продукта |

`projectId` и URL проекта предварительны до контракта. `certificateId` соответствует терминологии текущего бэкенда, хотя в интерфейсе используется «диплом». Параметры ссылок подтверждения/восстановления нельзя логировать; после обмена одноразового токена очищать URL по согласованному flow.

## Первый набор компонентов

Это проверенные точки входа для этапов основы и авторизации. Приоритет этой таблицы выше автоматически предложенных имён в большом реестре.

| Figma | ID | Будущий файл |
| --- | --- | --- |
| Typography / Role map | `6874:17638` | `src/components/quarks/Typography/Typography.tsx` |
| Q-ICON / Tintable | `6876:17638` | `src/components/quarks/Icon/Icon.tsx` |
| CMP-ATOM-BUTTON | `2425:264` | `src/components/atoms/Button/Button.tsx` |
| CMP-ATOM-INPUT | `59:3850` | `src/components/atoms/Input/Input.tsx` |
| CMP-ATOM-CHECKBOX | `2024:8882` | `src/components/atoms/Checkbox/Checkbox.tsx` |
| CMP-ATOM-TEXT-LINK | `5974:13536` | `src/components/atoms/TextLink/TextLink.tsx` |
| CMP-MOL-PROMPT-LINK | `7482:17949` | `src/components/molecules/PromptLink/PromptLink.tsx` |
| CMP-MOL-CONSENT-ROW | `7485:17962` | `src/components/molecules/ConsentRow/ConsentRow.tsx` |
| CMP-ORG-AUTH-LOGIN-FORM | `7495:18063` | `src/components/organisms/auth/LoginForm/LoginForm.tsx` |
| CMP-ORG-AUTH-SIGN-UP-FORM | `7495:18009` | `src/components/organisms/auth/RegisterForm/RegisterForm.tsx` |
| CMP-TPL-AUTH-PAGE | `7499:18266` | `src/components/templates/AuthTemplate/AuthTemplate.tsx` |
| SCR-AUTH-002 · Вход | `5673:81` | `src/pages/auth/LoginPage.tsx` |

Шаблон AUTH содержит общую двухколоночную композицию, фон и брендовые элементы. Иллюстрация конкретного экрана и организм формы передаются ему отдельно. В сгенерированном reference поля представлены кнопками, а submit — ссылкой: в реализации заменить их семантическими input/form/button.

Input: medium/large; default, hover, focus, error, error+focus, disabled; плавающая подпись и слоты иконок. Button: назначение, стиль, размер, hover/pressed; loading/focus/disabled не размножают отдельные цветовые компоненты. Варианты не равны отдельным страницам.

## Токены и шрифты

[Снимок 33 значений](figma/auth-token-snapshot.json) получен из AUTH и Button. Это разрешённые значения выбранных узлов, не экспорт всех коллекций и режимов темы.

- Основной текст AUTH: `#0b2558`; вторичный: `#60739a`; границы: `#dde7fa`; синий: `#2563ff`.
- Форма: отступ 40, радиус 16; элементы используют интервалы 4/6/8/10/14/16; значения задавать в системе токенов, а не повторять в каждом компоненте.
- В AUTH используются Inter и Space Grotesk. Заголовок формы: Space Grotesk 30/38, 700; основной текст: Inter 14/20, 400.
- Проверить реальные файлы шрифтов, кириллицу, используемые веса и права на распространение до подключения. Метаданные Figma не подтверждают наличие файлов шрифта и его кириллического покрытия.
- Названия цветов с парами light/dark не доказывают, что все тёмные значения уже получены. Тёмную тему нельзя объявлять реализованной по текущему снимку.

## Исходники и качество изображений

| Раздел | ID |
| --- | --- |
| Icons / source | `491:17638` |
| Assets / Brand | `5254:613203` |
| Assets / Photos | `5255:613914` |
| Assets / Illustrations | `6633:14050` |
| Подготовленные PNG-экспорты | `7364:43339` |
| AUTH / assets export | `7456:17903` |

Для `auth-illustration-login`, узел `7456:17955`, выполнен пробный экспорт и загрузка оригиналов без перекодирования:

| Файл | Размер | Байт | SHA-256 |
| --- | --- | --- | --- |
| `figma/asset-check/login-export.png` | 565×565 | 279671 | `9d68a070e37b0686639399a39773da28aa96656678a1cc97becb6111c93f64fe` |
| `figma/asset-check/login-source-1.png` | 1254×1254 | 1450054 | `ae7998580313e7110547c303439911d6ba91bf30d8b8cb3ef9db9f4a26639b1b` |
| `figma/asset-check/login-source-2.png` | 314×314 | 115503 | `7d2437c14a3a189cfdc925189b3f9904b1faa3833d96519a83c699d5ffc20583` |

Первый оригинал визуально проверен: иллюстрация входа с прозрачностью. Второй возвращён как дополнительный raw image; его назначение отдельно не подтверждено. Эти файлы — образцы инвентаризации; при реализации выбранный исходник переносится в `src/assets`, без дублирования нескольких копий в production.

При выводе 565 CSS px исходник 1254 px покрывает DPR 2 по размеру. Это не обещание качества каждого asset: для DPR 3 при том же размере потребовалось бы 1695 px. Увеличение PNG не добавляет исходную детализацию. Для слоя с кадрированием, масками или эффектами нужно воспроизводить композицию, а не слепо подменять его raw image.

Порядок переноса: исходный raster → проверка размеров/прозрачности → сопоставление с Figma → именованный файл. Вектор экспортировать как SVG, когда он действительно векторный. Не конвертировать все assets в PNG и не пересохранять оригиналы через скриншот. Временные URL скачивания в документах не сохраняются.

Полная выгрузка пока не выполнялась: инструменты возвращают ограниченное число изображений на поддерево, поэтому экспорт вести небольшими группами с контролем полноты. Сейчас пользователю не требуется вручную переносить все PNG.

## Мобильные решения и расхождения

- Полноценные mobile/tablet-экраны по именам в этой desktop-странице не обнаружены; это не утверждение об отсутствии их в других страницах файла.
- Найдены текстовые указания для сетки курсов (`5292:18026`) и настроек (`6004:13487`). Остальное мобильное поведение — проектные решения из плана адаптации.
- Знания в текущей Figma имеют общий профиль пользователя, canonical knowledgeUnitId, aliases и связи курсов (`5413:4`, `5413:10`). Это шире модели базы знаний трека в DRAFT. Нельзя реализовывать взаимное переиспользование знаний без подтверждённого API.
- На странице есть legacy-группы и замены. Перед новым компонентом проверять канонический узел, а не копировать визуально похожую старую версию.
- Вход содержит ещё общие подписи «Ссылка». Перед сборкой задать смысловые тексты действий и проверить их назначения, не переносить placeholder как финальный текст.
# Этап 6: добавленные сопоставления

Файл `hvF90E8EGKFYvS1FxAgSvQ`, страница «Прототип Десктоп MVP». Контексты получены 21.09.2026.

| Узел | Реализация |
| --- | --- |
| `6363:13130` — карта | `pages/learn/LearnPage`, `RoadmapTopic`; упрощённая карта одного модуля |
| `6363:13356` — урок | `pages/learn/LearnPage`, `LearningContent` |
| `5407:24186` — база курса | `pages/knowledge/KnowledgePage` |
| `5407:24838` — вопрос | Детали и самооценка в `KnowledgePage` |
| `6565:12450` — общая база | `pages/knowledge/KnowledgeIndex` |

Переиспользована иконка книги из предыдущего экспорта. Новых растровых исходников нет. [Отклонения, адаптация и QA](stage6-learning-knowledge.md); полное соответствие всем вариантам макетов пока не заявляется.

## Stage 9 ? Landing

`5591:223968` ? `frontend/src/pages/landing/LandingPage.tsx` + `components/organisms/LandingFeature`. Original exports: [manifest](figma/stage9-landing-assets.json). [Responsive adaptations and limitations](stage9-landing.md).
