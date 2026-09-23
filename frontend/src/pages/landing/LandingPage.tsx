import { Link, type MetaFunction } from 'react-router';

import { LandingFeature } from '@/components/organisms/LandingFeature';

import hero from '@/assets/landing/hero.png';
import faqImage from '@/assets/landing/faq.png';
import logo from '@/assets/screens/logo.png';

import planIcon from '@/assets/landing/planIcon.png';
import sourcesIcon from '@/assets/landing/sourcesIcon.png';
import practiceIcon from '@/assets/landing/practiceIcon.png';

import { offers, questions, sections } from './landing-content';
import styles from './LandingPage.module.css';

const title = 'Репит.центр — персональная система обучения с ИИ';

const description =
  'Поставьте цель — Репит.центр поможет собрать персональный учебный маршрут, подобрать материалы, закрепить знания практикой и отслеживать реальный прогресс.';

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
          <img
            className={styles.logo}
            src={logo}
            width={248}
            height={83}
            alt="Репит.центр"
          />
        </Link>

        <nav className={styles.nav} aria-label="Основная навигация">
          <a href="#about">Как это работает</a>
          <a href="#trust">Источники</a>
          <a href="#tutor">ИИ-репетитор</a>
          <a href="#pricing">Тарифы</a>
          <a href="#faq">Вопросы</a>
        </nav>

        <Link className={styles.secondary} to="/auth/login">
          Войти
        </Link>
      </header>

      <main id="main" tabIndex={-1} className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              Персональное обучение с ИИ
            </p>

            <h1 id="hero-title">
              Учись по плану,
              <span>собранному под твою цель</span>
            </h1>

            <p className={styles.lead}>
              Расскажи, чему хочешь научиться и за какой срок.
              Репит.центр проверит материалы, соберёт маршрут,
              поможет проходить темы и покажет, что уже освоено.
            </p>

            <div className={styles.actions}>
              <Link className={styles.primary} to="/app/plans/new">
                Собрать мой план
              </Link>

              <a className={styles.secondary} href="#how-it-works">
                Посмотреть, как работает сервис
              </a>
            </div>

            <div className={styles.benefits}>
              <article>
                <span className={`${styles.miniIcon} ${styles.plan}`}>
                  <img src={planIcon} alt="" />
                </span>

                <div>
                  <h2>План</h2>
                  <p>Под твою цель и срок</p>
                </div>
              </article>

              <article>
                <span className={`${styles.miniIcon} ${styles.sources}`}>
                  <img src={sourcesIcon} alt="" />
                </span>

                <div>
                  <h2>Источники</h2>
                  <p>Проверенные материалы по теме</p>
                </div>
              </article>

              <article>
                <span className={`${styles.miniIcon} ${styles.practice}`}>
                  <img src={practiceIcon} alt="" />
                </span>

                <div>
                  <h2>Практика</h2>
                  <p>Задания и проверка понимания</p>
                </div>
              </article>
            </div>
          </div>

          <img
            className={styles.heroImage}
            src={hero}
            width={1387}
            height={1126}
            alt="Персональный учебный маршрут в Репит.центр"
            fetchPriority="high"
          />
        </section>

        <p className={styles.notice}>
          Репит.центр находится в разработке. Сейчас можно познакомиться
          с интерфейсом и основными сценариями будущего сервиса.
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
                Собрать персональный план
              </Link>
            )}

            {section.id === 'pilot' && (
              <Link className={styles.primary} to="/app">
                Посмотреть демонстрацию
              </Link>
            )}
          </LandingFeature>
        ))}

        <section
          id="pricing"
          className={styles.pricing}
          aria-labelledby="pricing-title"
        >
          <h2 id="pricing-title">
            Выбери <span>подходящий формат</span>
          </h2>

          <p className={styles.lead}>
            Начни бесплатно. Если сервис подходит — подключи больше
            возможностей ИИ, персонализации и помощи специалистов.
          </p>

          <div className={styles.offers}>
            {offers.map((offer, index) => (
              <article
                className={index === 1 ? styles.featured : ''}
                key={offer.name}
              >
                {index === 1 && (
                  <p className={styles.eyebrow}>Основной тариф</p>
                )}

                {index === 2 && (
                  <p className={styles.futureBadge}>Будущее платформы</p>
                )}

                <h3>{offer.name}</h3>

                <p className={styles.offerDescription}>{offer.text}</p>

                <div className={styles.priceRow}>
                  <strong className={styles.price}>{offer.price}</strong>
                  <span>{offer.suffix}</span>
                </div>

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

        <section
          id="faq"
          className={styles.faq}
          aria-labelledby="faq-title"
        >
          <div>
            <h2 id="faq-title">
              Частые <span>вопросы</span>
            </h2>

            <p className={styles.lead}>
              Самое важное о том, как будет работать Репит.центр.
            </p>

            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}

            <p className={styles.faqContact}>
              Не нашёл ответ? Напиши нам — поможем разобраться.
            </p>
          </div>

          <img
            src={faqImage}
            width={1448}
            height={1086}
            loading="lazy"
            decoding="async"
            alt=""
          />
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

          <p>Персональное обучение с ИИ — от цели до результата.</p>
          <p>© 2026 Репит.центр · MVP</p>
        </div>

        <nav aria-label="О продукте">
          <strong>Продукт</strong>
          <a href="#about">Как это работает</a>
          <a href="#how-it-works">Учебный маршрут</a>
          <a href="#tutor">ИИ-репетитор</a>
          <a href="#assessment">Проверка знаний</a>
        </nav>

        <nav aria-label="Информация">
          <strong>Информация</strong>
          <Link to="/legal/privacy">
            Политика конфиденциальности
          </Link>
          <Link to="/legal/terms">
            Пользовательское соглашение
          </Link>
        </nav>
      </footer>
    </div>
  );
}