import { Link, type MetaFunction } from 'react-router';
import { LandingFeature } from '@/components/organisms/LandingFeature';
import hero from '@/assets/landing/hero.png';
import faqImage from '@/assets/landing/faq.png';
import logo from '@/assets/screens/logo.png';
import planIcon from '@/assets/landing/planIcon.png';
import sourcesIcon from '@/assets/landing/sourcesIcon.png';
import practiceIcon from '@/assets/landing/practiceIcon.png';
import { sections, questions, offers } from './landing-content';
import styles from './LandingPage.module.css';
const title = 'Репит.центр — персональный план обучения с ИИ';
const description =
  'Ваш путь к новым знаниям: персональный учебный маршрут, материалы, практика и помощь ИИ-наставника. Познакомьтесь с демонстрацией Репит.центр.';
export const meta: MetaFunction = () => [
  { title },
  { name: 'description', content: description },
  { property: 'og:title', content: title },
  { property: 'og:description', content: description },
  { property: 'og:type', content: 'website' },
  { property: 'og:locale', content: 'ru_RU' },
];
export default function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" aria-label="Репит.центр — главная">
          <img className={styles.logo} src={logo} width={248} height={83} alt="Репит.центр" />
        </Link>
        <nav className={styles.nav} aria-label="Основная навигация">
          <a href="#about">О проекте</a>
          <a href="#trust">Доверие и контроль</a>
          <a href="#how-it-works">Как это работает</a>
          <a href="#pricing">Тарифы</a>
          <a href="#faq">Вопросы</a>
        </nav>
        <Link className={styles.secondary} to="/auth/login">
          Войти
        </Link>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div>
            <p className={styles.eyebrow}>Ваш персональный ИИ-репетитор</p>
            <h1 id="hero-title">
              Научись чему угодно <span>по персональному плану</span>
            </h1>
            <p className={styles.lead}>
              Опиши цель — получи маршрут от первого шага до результата: материалы, практику и
              помощь ИИ в одном месте.
            </p>
            <div className={styles.actions}>
              <Link className={styles.primary} to="/app/plans/new">
                Создать мой план
              </Link>
              <a className={styles.secondary} href="#how-it-works">
                Посмотреть, как это работает
              </a>
            </div>
            <div className={styles.benefits}>
              {[
                {
                  name: 'План',
                  text: 'Под твою цель, срок и уровень',
                  image: planIcon,
                  kind: 'plan',
                },
                {
                  name: 'Источники',
                  text: 'Материалы по теме обучения',
                  image: sourcesIcon,
                  kind: 'sources',
                },
                {
                  name: 'Практика',
                  text: 'Знания закрепляются в деле',
                  image: practiceIcon,
                  kind: 'practice',
                },
              ].map(({ name, text, image, kind }) => (
                <article key={name}>
                  <span className={`${styles.miniIcon} ${styles[kind]}`}>
                    <img src={image} alt="" width={64} height={64} />
                  </span>
                  <div>
                    <h2>{name}</h2>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <img
            className={styles.heroImage}
            src={hero}
            width={1387}
            height={1126}
            alt="Пример персонального учебного плана с ИИ-наставником"
            fetchPriority="high"
          />
        </section>
        <p className={styles.notice}>
          Сервис в разработке. Сейчас доступна демонстрация с тестовыми данными; реальный ИИ,
          платежи и выдача документов ещё не подключены.
        </p>
        {sections.map((section) => (
          <LandingFeature key={section.id} {...section}>
            {section.points && (
              <ul className={styles.points}>
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            )}
            {section.id === 'system' && (
              <Link className={styles.primary} to="/app/plans/new">
                Создать персональный план
              </Link>
            )}
            {section.id === 'pilot' && (
              <Link className={styles.primary} to="/app">
                Перейти к обучению
              </Link>
            )}
          </LandingFeature>
        ))}
        <section id="pricing" className={styles.pricing} aria-labelledby="pricing-title">
          <h2 id="pricing-title">
            Выбери <span>формат участия</span>
          </h2>
          <p className={styles.lead}>Один продукт — разные возможности.</p>
          <p className={styles.notice}>
            Предварительные тарифы из дизайн-проекта. Оплата не подключена, цены и условия могут
            измениться до запуска.
          </p>
          <div className={styles.offers}>
            {offers.map((offer, index) => (
              <article className={index === 1 ? styles.featured : ''} key={offer.name}>
                {index === 1 && <p className={styles.eyebrow}>Пилотный формат</p>}
                <h3>{offer.name}</h3>
                <p>{offer.text}</p>
                <strong className={styles.price}>{offer.price}</strong>
                <p>{index === 0 ? 'демонстрационный доступ' : '/ месяц · проект тарифа'}</p>
                <ul>
                  {offer.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {offer.to ? (
                  <Link className={styles.secondary} to={offer.to}>
                    {offer.label}
                  </Link>
                ) : (
                  <p className={styles.future}>{offer.label}</p>
                )}
              </article>
            ))}
          </div>
        </section>
        <section id="faq" className={styles.faq} aria-labelledby="faq-title">
          <div>
            <h2 id="faq-title">
              Частые <span>вопросы</span>
            </h2>
            <p className={styles.lead}>Самое важное перед первым шагом.</p>
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
          <img src={faqImage} width={1448} height={1086} loading="lazy" decoding="async" alt="" />
        </section>
      </main>
      <footer className={styles.footer}>
        <div>
          <img
            className={styles.logo}
            src={logo}
            width={248}
            height={83}
            alt="Репит.центр"
            loading="lazy"
          />
          <p>Персональная система обучения с ИИ.</p>
          <p>© 2026 Репит.центр · MVP</p>
        </div>
        <nav aria-label="О продукте">
          <a href="#about">О проекте</a>
          <a href="#how-it-works">Как это работает</a>
          <a href="#tutor">ИИ-репетитор</a>
          <a href="#assessment">Проверка знаний</a>
        </nav>
        <nav aria-label="Правовая информация">
          <Link to="/legal/privacy">Политика конфиденциальности</Link>
          <Link to="/legal/terms">Условия использования</Link>
          <p>Юридические документы готовятся к публикации.</p>
        </nav>
      </footer>
    </div>
  );
}
