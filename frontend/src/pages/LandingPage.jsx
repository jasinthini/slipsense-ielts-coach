import { useState } from 'react';
import './LandingPage.css';

const skills = [
  {
    name: 'Writing',
    art: 'writing',
    path: '/writing',
    description: 'Plan, write and develop your ideas with focused practice.',
  },
  {
    name: 'Speaking',
    art: 'speaking',
    path: '/speaking',
    description: 'Explore speaking prompts and record your responses.',
  },
  {
    name: 'Reading',
    art: 'reading',
    path: '/reading',
    description: 'Build your understanding with passages and questions.',
  },
  {
    name: 'Listening',
    art: 'listening',
    description: 'A new space to practise understanding spoken English.',
    soon: true,
  },
];

const benefits = [
  {
    title: 'Save your ideas.',
    text: 'Keep your writing drafts and return when you are ready.',
  },
  {
    title: 'Practise at your pace.',
    text: 'Choose a skill and make practice part of your day.',
  },
  {
    title: 'Understand your writing.',
    text: 'Explore AI guidance on your ideas, grammar and vocabulary.',
  },
];

function Icon({ name, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {name === 'arrow' && (
        <path d="M4 12h16m-6-6 6 6-6 6" />
      )}

      {name === 'study' && (
        <>
          <path d="m2 8 10-5 10 5-10 5Z" />
          <path d="M6 10v7q6 5 12 0v-7M22 8v8" />
        </>
      )}

      {name === 'career' && (
        <>
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M8 7V4h8v3M3 12q9 6 18 0M10 14h4" />
        </>
      )}

      {name === 'people' && (
        <>
          <circle cx="9" cy="7" r="4" />
          <path d="M2 21v-3a7 7 0 0 1 14 0v3M17 3a4 4 0 0 1 0 8M18 14q4 1 4 5v2" />
        </>
      )}

      {name === 'plane' && (
        <path d="m21 3-6 18-4-8-8-4 18-6ZM11 13 21 3" />
      )}
    </svg>
  );
}

function Wave() {
  return (
    <svg
      className="bn-wave"
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 40C250-12 390 94 710 56s480-57 730-28v62H0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Globe() {
  const [paused, setPaused] = useState(false);

  const continents = (
    <>
      <path d="m25 44 24-20 35 4 16 18-10 14-21 1-10 18-20-9-6-15Z" />
      <path d="m67 81 20 8 12 23-10 28-13 20-8-26 4-20-15-18Z" />
      <path d="m112 30 16-15 15 6-4 25-18 5Z" />
      <path d="m157 48 20-18 25 5 9-10 37 8 29 22-8 19-25-3-10 20-14-8-9 18-15-15-12-18-21 1Z" />
      <path d="m169 77 25-5 18 22-5 31-16 19-15-28-10-18Z" />
      <path d="m248 122 23-11 20 13-6 20-25 5-16-14Z" />
      <path d="m223 100 8 13 10 3 1-11-11-10Z" />
      <path d="m13 168 65-3 53 5 57-5 64 4 52-2v12H13Z" />
    </>
  );

  return (
    <div className={`bn-globe-scene ${paused ? 'is-paused' : ''}`}>
      <div className="bn-globe-art" aria-hidden="true">
        <div className="bn-globe-shadow" />

        <div className="bn-earth">
          <svg
            className="bn-earth-map"
            viewBox="0 0 640 180"
            preserveAspectRatio="none"
          >
            <g fill="#B4D4EA">{continents}</g>

            <g fill="#B4D4EA" transform="translate(320 0)">
              {continents}
            </g>
          </svg>

          <div className="bn-earth-light" />
        </div>

        <div className="bn-orbit">
          <span className="bn-plane">
            <Icon name="plane" />
          </span>
        </div>

        <div className="bn-globe-cap">
          <Icon name="study" />
        </div>
      </div>

      <button
        className="bn-motion-control"
        type="button"
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? 'Play globe animation' : 'Pause globe animation'}
      </button>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="bn-page">
      <a className="bn-skip" href="#bn-main">
        Skip to content
      </a>

      <header className="bn-header">
        <nav className="bn-navigation" aria-label="Main navigation">
          <a
            className="bn-brand"
            href="/"
            aria-label="Band Buddy home"
          >
            <img src="/images/logo.png" alt="Band Buddy" />
          </a>

          <div className="bn-desktop-links">
            <a href="#practice">Practice</a>
            <a href="#approach">Our approach</a>
            <a href="#global-learning">Global learning</a>
          </div>

          <div className="bn-nav-actions">
            <a className="bn-login" href="/login">
              Log in
            </a>

            <a
              className="bn-button bn-button-small"
              href="/register"
            >
              Get started
            </a>

            <button
              className="bn-menu-button"
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="bn-mobile-menu"
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <nav
            className="bn-mobile-menu"
            id="bn-mobile-menu"
            aria-label="Mobile navigation"
          >
            <a href="#practice" onClick={closeMenu}>
              Practice
            </a>

            <a href="#approach" onClick={closeMenu}>
              Our approach
            </a>

            <a href="#global-learning" onClick={closeMenu}>
              Global learning
            </a>
          </nav>
        )}
      </header>

      <main id="bn-main">
        <section
          className="bn-hero"
          aria-labelledby="bn-title"
        >
          <img
            className="bn-hero-image"
            src="/images/landing-hero.png"
            alt=""
            fetchPriority="high"
          />

          <div className="bn-hero-shade" />

          <div className="bn-shell bn-hero-inner">
            <div className="bn-hero-copy">
              <p className="bn-eyebrow">
                YOUR AMBITION. YOUR PACE.
              </p>

              <h1 id="bn-title">
                A clearer path<br />
                to your IELTS<br />
                goals.
              </h1>

              <p className="bn-hero-description">
                Build your English confidence,<br />
                one session at a time.
              </p>
            </div>
          </div>

          <Wave />
        </section>

        <section
          id="practice"
          className="bn-practice"
          aria-labelledby="bn-practice-title"
        >
          <div className="bn-shell">
            <h2
              className="bn-centered"
              id="bn-practice-title"
            >
              Choose your next small step.
            </h2>

            <div className="bn-practice-layout">
              <div className="bn-skill-grid">
                {skills.map((skill) => (
                  <article
                    className="bn-skill-card"
                    key={skill.art}
                  >
                    <span
                      className={`bn-skill-picture bn-art-${skill.art}`}
                      aria-hidden="true"
                    />

                    <div className="bn-skill-copy">
                      <div className="bn-skill-heading">
                        <h3>{skill.name}</h3>

                        {skill.soon && (
                          <span className="bn-soon">
                            Coming soon
                          </span>
                        )}
                      </div>

                      <p>{skill.description}</p>
                    </div>

                    {!skill.soon && (
                      <a
                        className="bn-card-link"
                        href={skill.path}
                        aria-label={`Explore ${skill.name.toLowerCase()}`}
                      >
                        <Icon name="arrow" />
                      </a>
                    )}
                  </article>
                ))}
              </div>

              <aside className="bn-practice-intro">
                <h2>
                  One space.<br />
                  Four ways<br />
                  to grow.
                </h2>

                <p>
                  Focused English practice that fits your goals,
                  your schedule and your next step.
                </p>

                <span className="bn-prototype-note">
                  Writing, speaking recording and sample reading are
                  available. Listening is coming soon.
                </span>
              </aside>
            </div>
          </div>
        </section>

        <section
          id="approach"
          className="bn-approach"
          aria-labelledby="bn-approach-title"
        >
          <img
            className="bn-approach-image"
            src="/images/landing-study.png"
            alt=""
            loading="lazy"
          />

          <div className="bn-approach-shade" />

          <div className="bn-shell bn-approach-inner">
            <div className="bn-approach-copy">
              <h2 id="bn-approach-title">
                Progress starts<br />
                with showing up.
              </h2>

              <ol className="bn-benefits">
                {benefits.map((benefit, index) => (
                  <li key={benefit.title}>
                    <span className="bn-benefit-number">
                      {index + 1}
                    </span>

                    <div>
                      <h3>{benefit.title}</h3>
                      <p>{benefit.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section
          className="bn-outcomes"
          aria-labelledby="bn-outcomes-title"
        >
          <div className="bn-shell">
            <h2 id="bn-outcomes-title">
              English for what comes next.
            </h2>

            <div className="bn-outcome-grid">
              <article>
                <Icon name="study" />

                <div>
                  <h3>Study</h3>
                  <p>
                    Feel more prepared for learning and sharing your
                    ideas in English.
                  </p>
                </div>
              </article>

              <article>
                <Icon name="career" />

                <div>
                  <h3>Career</h3>
                  <p>
                    Build the confidence to express your thoughts in
                    professional settings.
                  </p>
                </div>
              </article>

              <article>
                <Icon name="people" />

                <div>
                  <h3>Everyday confidence</h3>
                  <p>
                    Feel more comfortable joining conversations and
                    meeting new people.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          id="global-learning"
          className="bn-global"
          aria-labelledby="bn-global-title"
        >
          <div className="bn-shell bn-global-layout">
            <Globe />

            <div className="bn-global-copy">
              <p className="bn-eyebrow">
                STUDY ABROAD / GLOBAL OPPORTUNITIES
              </p>

              <h2 id="bn-global-title">
                Your learning.<br />
                A world of<br />
                possibilities.
              </h2>

              <p>
                Build your English confidence
                <br className="bn-desktop-break" />
                {' '}for study, work and life abroad.
              </p>
            </div>
          </div>
        </section>

        <section className="bn-invitation">
          <div className="bn-shell">
            <h2>
              Your next chapter starts<br />
              with a little practice.
            </h2>

            <a className="bn-button" href="/register">
              Create account <Icon name="arrow" />
            </a>
          </div>
        </section>
      </main>

      <footer className="bn-footer">
        <div className="bn-shell">
          <p className="bn-footer-message">
            Small steps today. A world of possibilities tomorrow.
          </p>

          <div className="bn-footer-bottom">
            <span>
              © {new Date().getFullYear()} Band Buddy
            </span>

            <span>
              Independent IELTS practice. AI guidance is not an
              official IELTS assessment.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}