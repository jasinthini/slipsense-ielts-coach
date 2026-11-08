import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './WritingCategories.css';

const categories = [
  {
    id: 'discussion',
    group: 'essay',
    title: 'Discussion essay',
    subtitle: 'TASK 2 · ACADEMIC & GENERAL TRAINING',
    description: 'Explore both views and explain your opinion.',
    icon: 'discussion',
    available: true,
  },
  {
    id: 'opinion',
    group: 'essay',
    title: 'Opinion essay',
    subtitle: 'TASK 2 · ACADEMIC & GENERAL TRAINING',
    description: 'Explain whether you agree or disagree.',
    icon: 'opinion',
    available: true,
  },
  {
    id: 'letters',
    group: 'general',
    title: 'Letter writing',
    subtitle: 'TASK 1 · GENERAL TRAINING',
    description: 'Practise writing for everyday situations.',
    icon: 'letter',
    available: true,
  },
  {
    id: 'bar',
    group: 'academic',
    title: 'Bar chart',
    subtitle: 'TASK 1 · ACADEMIC',
    description: 'Compare categories and important figures.',
    icon: 'bar',
  },
  {
    id: 'line',
    group: 'academic',
    title: 'Line graph',
    subtitle: 'TASK 1 · ACADEMIC',
    description: 'Describe patterns and changes over time.',
    icon: 'line',
    available: true,
  },
  {
    id: 'pie',
    group: 'academic',
    title: 'Pie chart',
    subtitle: 'TASK 1 · ACADEMIC',
    description: 'Compare proportions and percentages.',
    icon: 'pie',
    available: true
  },
  {
    id: 'map',
    group: 'academic',
    title: 'Maps',
    subtitle: 'TASK 1 · ACADEMIC',
    description: 'Describe locations and changes to a place.',
    icon: 'map',
  },
  {
    id: 'process',
    group: 'academic',
    title: 'Process diagram',
    subtitle: 'TASK 1 · ACADEMIC',
    description: 'Explain stages in a process or cycle.',
    icon: 'process',
  },
  {
    id: 'table',
    group: 'academic',
    title: 'Table',
    subtitle: 'TASK 1 · ACADEMIC',
    description: 'Summarise data and make comparisons.',
    icon: 'table',
  },
];

function CategoryIcon({ name }) {
  const paths = {
    discussion: (
      <>
        <path d="M3 3h13v10H9l-4 4v-4H3Z" />
        <path d="M19 8h3v12h-4l-3 3v-3h-4v-4" />
      </>
    ),
    opinion: (
      <>
        <path d="M8 15a6 6 0 1 1 8 0l-1 3H9Z" />
        <path d="M9 21h6M10 18h4" />
      </>
    ),
    letter: (
      <>
        <rect x="2" y="5" width="20" height="15" rx="2" />
        <path d="m3 7 9 7 9-7" />
      </>
    ),
    bar: <path d="M3 3v18h19M7 17v-6M12 17V6M17 17V9" />,
    line: <path d="M3 3v18h19M6 15l5-6 5 3 5-7" />,
    pie: (
      <>
        <path d="M11 3a9 9 0 1 0 10 10H11Z" />
        <path d="M15 2v7h7a8 8 0 0 0-7-7Z" />
      </>
    ),
    map: (
      <>
        <path d="m2 5 7-3 6 3 7-3v17l-7 3-6-3-7 3ZM9 2v17M15 5v17" />
      </>
    ),
    process: (
      <>
        <rect x="2" y="3" width="7" height="6" rx="1" />
        <rect x="15" y="15" width="7" height="6" rx="1" />
        <path d="M9 6h9v6m-3-3 3 3 3-3M5 9v9h7" />
      </>
    ),
    table: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 3v18M3 15h18" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function WritingCategories() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    if (!sessionStorage.getItem('band_buddy_access_token')) {
      navigate('/login', { replace: true });
      return;
    }

    setError('');

    api.get('/auth/me', { signal: controller.signal })
      .then(() => {
        if (active) setReady(true);
      })
      .catch((err) => {
        if (!active) return;

        if (err.response?.status === 401) {
          sessionStorage.removeItem('band_buddy_access_token');
          navigate('/login', { replace: true });
        } else {
          setError('Could not load writing practice. Please try again.');
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [navigate, retry]);

  const visibleCategories = categories.filter(
    (category) => filter === 'all' || category.group === filter
  );

  return (
    <div className="wc-page">
      <header className="wc-header">
        <Link to="/dashboard" aria-label="Band Buddy dashboard">
          <img src="/images/logo.png" alt="Band Buddy" />
        </Link>
        <Link to="/dashboard">← Back to dashboard</Link>
      </header>

      <main className="wc-main">
        {!ready ? (
          <div className="wc-state">
            <p role={error ? 'alert' : 'status'}>
              {error || 'Loading your writing practice…'}
            </p>
            {error && (
              <button type="button" onClick={() => setRetry((v) => v + 1)}>
                Try again
              </button>
            )}
          </div>
        ) : (
          <>
            <section className="wc-heading">
              <span>BUILD YOUR WRITING CONFIDENCE</span>
              <h1>Every good answer starts here.</h1>
              <p>
                Choose a question type. Take your time, organise your
                ideas and make each answer your own.
              </p>
              <div className="wc-heading-note">
                Original sample questions · More practice types coming soon
              </div>
            </section>

            <nav className="wc-filters" aria-label="Filter writing categories">
              {[
                ['all', 'All writing'],
                ['academic', 'Academic · Task 1'],
                ['general', 'General Training · Task 1'],
                ['essay', 'Task 2 · Essays'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  className={filter === value ? 'is-selected' : ''}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="wc-grid">
              {visibleCategories.map((category) => {
                const content = (
                  <>
                    <span className="wc-icon">
                      <CategoryIcon name={category.icon} />
                    </span>
                    <div className="wc-card-copy">
                      <span className="wc-subtitle">{category.subtitle}</span>
                      <h2>{category.title}</h2>
                      <p>{category.description}</p>
                      <span className="wc-card-status">
                        {category.available ? 'Open practice →' : 'Coming soon'}
                      </span>
                    </div>
                  </>
                );

                return category.available ? (
                  <Link
                    className="wc-card"
                    key={category.id}
                    to={`/writing/practice?category=${category.id}`}
                  >
                    {content}
                  </Link>
                ) : (
                  <article className="wc-card wc-unavailable" key={category.id}>
                    {content}
                  </article>
                );
              })}
            </div>

            <footer className="wc-footer">
              Band Buddy · Small steps. Meaningful progress.
            </footer>
          </>
        )}
      </main>
    </div>
  );
}