import { useState } from 'react';
import '../App.css';

function Icon({ name, ...props }) {
  const shapes = {
    writing: (
      <>
        <path d="M13 4H5a2 2 0 0 0-2 2v14h14v-8" />
        <path d="m14 5 3-3 5 5-3 3M9 16l2-5 6-6 5 5-6 6-5 2Z" />
        <path d="M6 8h4M6 12h2" />
      </>
    ),
    speaking: (
      <>
        <rect x="9" y="2" width="6" height="13" rx="3" />
        <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
      </>
    ),
    reading: (
      <>
        <path d="M12 6C9 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2Z" />
        <path d="M12 6v15" />
      </>
    ),
    listening: (
      <>
        <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
        <rect x="2" y="12" width="5" height="9" rx="2" />
        <rect x="17" y="12" width="5" height="9" rx="2" />
      </>
    ),
    target: (
      <>
        <circle cx="11" cy="13" r="9" />
        <circle cx="11" cy="13" r="5" />
        <path d="m11 13 10-10M16 3h5v5" />
      </>
    ),
    feedback: (
      <>
        <path d="M4 3h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9l-7 4V5a2 2 0 0 1 2-2Z" />
        <path d="M7 10h.01M12 10h.01M17 10h.01" />
      </>
    ),
    progress: (
      <>
        <path d="M4 21v-7M10 21V9M16 21V4M22 21V1" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {shapes[name]}
    </svg>
  );
}

const skills = [
  {
    icon: 'writing',
    title: 'Writing',
    text: 'Practise essays and get feedback on your ideas, grammar and vocabulary.',
  },
  {
    icon: 'speaking',
    title: 'Speaking',
    text: 'Practise expressing your ideas and build confidence in spoken English.',
  },
  {
    icon: 'reading',
    title: 'Reading',
    text: 'Build your reading skills with passages and focused practice questions.',
  },
  {
    icon: 'listening',
    title: 'Listening',
    text: 'Practise with audio and strengthen your understanding of spoken English.',
  },
];

const steps = [
  {
    icon: 'target',
    title: 'Practise',
    text: 'Try IELTS-style tasks anytime, at your own pace.',
  },
  {
    icon: 'feedback',
    title: 'Get feedback',
    text: 'Understand your mistakes with clear, personal guidance.',
  },
  {
    icon: 'progress',
    title: 'Improve',
    text: 'Turn feedback into progress and build confidence.',
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="bb-page">
      <a className="bb-skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="bb-header">
        <nav className="bb-shell bb-navigation" aria-label="Main navigation">
          <a className="bb-brand" href="/" aria-label="Band Buddy home">
            <img src="/images/logo.png" alt="Band Buddy" />
          </a>

          <div className="bb-desktop-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#plans">Plans &amp; Billing</a>
          </div>

          <div className="bb-nav-actions">
            <a className="bb-login" href="/login">
              Log in
            </a>
            <a className="bb-btn bb-btn-small" href="/register">
              Get started
            </a>

            <button
              className="bb-menu-button"
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <nav
            id="mobile-navigation"
            className="bb-mobile-links"
            aria-label="Mobile navigation"
          >
            <a href="#features" onClick={closeMenu}>Features</a>
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="#plans" onClick={closeMenu}>Plans &amp; Billing</a>
          </nav>
        )}
      </header>

      <main id="main-content">
        <section className="bb-hero" aria-labelledby="hero-title">
          <img
            className="bb-hero-art"
            src="/images/hero-banner.png"
            alt=""
            fetchPriority="high"
          />

          <div className="bb-shell bb-hero-inner">
            <div className="bb-hero-copy">
              <h1 id="hero-title">
                Your IELTS
                <br />
                journey <span>starts here.</span>
              </h1>

              <p>
                Practise with AI.
                <br />
                Learn from your feedback.
              </p>

              <a className="bb-btn" href="/register">
                Start practising
                <Icon name="arrow" />
              </a>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="bb-skills-section"
          aria-label="Practise all four IELTS skills"
        >
          <div className="bb-shell bb-skills-grid">
            {skills.map((skill) => (
              <article className="bb-skill-card" key={skill.title}>
                <span className="bb-icon-circle">
                  <Icon name={skill.icon} />
                </span>

                <div className="bb-skill-content">
                  <h2>{skill.title}</h2>
                  <p>{skill.text}</p>

                  <a
                    className="bb-card-arrow"
                    href="/register"
                    aria-label={`Start ${skill.title.toLowerCase()} practice`}
                  >
                    <Icon name="arrow" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="bb-steps-section"
          aria-label="How Band Buddy works"
        >
          <div className="bb-shell bb-steps-grid">
            {steps.map((step, index) => (
              <div className="bb-step" key={step.title}>
                <span className="bb-icon-circle bb-step-icon">
                  <Icon name={step.icon} />
                </span>

                <div>
                  <h2>{step.title}</h2>
                  <p>{step.text}</p>
                </div>

                {index < steps.length - 1 && (
                  <Icon name="arrow" className="bb-step-arrow" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section id="plans" className="bb-plans-section">
          <div className="bb-shell bb-plans-inner">
            <div>
              <h2>Practice that fits your goals.</h2>
              <p>
                Start with free access. Explore paid plans for more
                AI feedback and speaking practice.
              </p>
            </div>

            <a className="bb-btn bb-btn-outline" href="/register">
              Get started
              <Icon name="arrow" />
            </a>
          </div>
        </section>
      </main>

      <footer className="bb-footer">
        <div className="bb-shell bb-footer-inner">
          <span>© {new Date().getFullYear()} Band Buddy</span>
          <span>
            Independent IELTS preparation. AI estimates are not official
            IELTS scores.
          </span>
        </div>
      </footer>
    </div>
  );
}