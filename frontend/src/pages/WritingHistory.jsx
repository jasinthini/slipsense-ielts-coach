import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WritingHistoryContent from './WritingHistoryContent';
import { getPracticeAttempts } from '../services/practiceHistory';

const SKILLS = [
  { id: 'writing', label: 'Writing', path: '/writing' },
  { id: 'speaking', label: 'Speaking', path: '/speaking' },
  { id: 'reading', label: 'Reading', path: '/reading' },
  { id: 'listening', label: 'Listening', path: '/listening' },
];

const PAGE_SIZE = 20;

const styles = `
  .bh-page {
    min-height: 100vh;
    color: #112f50;
    background: linear-gradient(165deg, #e3f2ff, #f3f8fc 75%);
  }

  .bh-shell {
    box-sizing: border-box;
    width: min(1120px, 100%);
    margin-inline: auto;
    padding-inline: clamp(14px, 4vw, 32px);
  }

  .bh-topbar {
    background: #fff;
    border-bottom: 1px solid #d3e4f2;
  }

  .bh-topbar-inner {
    box-sizing: border-box;
    width: 100%;
    min-height: 76px;
    padding-inline: clamp(16px, 3vw, 44px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .bh-logo img {
    display: block;
    width: clamp(100px, 16vw, 150px);
    height: 55px;
    object-fit: contain;
    object-position: left center;
  }

  .bh-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 9px 14px;
    border: 1px solid #b4cee5;
    border-radius: 10px;
    background: #fff;
    color: #112f50;
    font: inherit;
    font-weight: 650;
    text-decoration: none;
    cursor: pointer;
  }

  .bh-button:hover {
    background: #eaf5ff;
  }

  .bh-body {
    padding-top: 28px;
    padding-bottom: 32px;
  }

  .bh-hero {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    padding: clamp(24px, 5vw, 48px);
    border-radius: 20px;
    color: #fff;
    background: linear-gradient(115deg, #102c50, #184f8b);
  }

  .bh-hero::after {
    content: "";
    position: absolute;
    z-index: -1;
    pointer-events: none;
    width: min(520px, 48%);
    aspect-ratio: 1;
    right: -8%;
    bottom: 0;
    transform: translateY(52%);
    border-radius: 50%;
    background: radial-gradient(
      circle closest-side at center,
      transparent 0 28%,
      rgba(155, 212, 255, .32) 28% 28.6%,
      transparent 28.6% 49%,
      rgba(155, 212, 255, .30) 49% 49.6%,
      transparent 49.6% 70%,
      rgba(155, 212, 255, .27) 70% 70.6%,
      transparent 70.6% 91%,
      rgba(155, 212, 255, .24) 91% 91.6%,
      transparent 91.6%
    );
  }

  .bh-hero .bh-kicker {
    margin: 0 0 8px;
    color: #bce3ff;
    font-size: .8rem;
    font-weight: 750;
    letter-spacing: .12em;
  }

  .bh-hero h1 {
    margin: 0 0 10px;
    color: #fff;
    font-size: clamp(2rem, 5vw, 3.5rem);
    line-height: 1.1;
  }

  .bh-hero p {
    margin: 0;
    color: #e4f1ff;
  }

  .bh-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    margin-block: 20px;
    padding: 6px;
    border: 1px solid #c9deef;
    border-radius: 14px;
    background: #fff;
  }

  .bh-tabs button {
    padding: 11px 5px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: #244767;
    font: inherit;
    font-weight: 650;
    cursor: pointer;
  }

  .bh-tabs button:hover {
    background: #eef7ff;
  }

  .bh-tabs button[aria-pressed="true"] {
    background: #d1eaff;
    color: #102c50;
  }

  .bh-panel {
    padding: clamp(16px, 4vw, 30px);
    border: 1px solid #c9deef;
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(17, 47, 80, .05);
  }

  .bh-panel-head,
  .bh-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .bh-panel-head {
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  .bh-panel-head h2 {
    margin: 0;
    color: #112f50;
  }

  .bh-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .bh-row {
    padding: 16px 0;
  }

  .bh-row + .bh-row {
    border-top: 1px solid #deebf5;
  }

  .bh-row strong {
    overflow-wrap: anywhere;
  }

  .bh-meta {
    margin: 6px 0 0;
    color: #496582;
    font-size: .9rem;
  }

  .bh-score {
    flex-shrink: 0;
    padding: 6px 12px;
    border-radius: 99px;
    background: #d8efff;
    color: #112f50;
    font-weight: 750;
  }

  .bh-message {
    padding: 24px 16px;
    border: 1px dashed #bcd7eb;
    border-radius: 12px;
    background: #f0f7fe;
    color: #345774;
    text-align: center;
  }

  .bh-message p {
    margin: 0;
  }

  .bh-message p + p {
    margin-top: 6px;
  }

  .bh-message .bh-button {
    margin-top: 12px;
  }

  .bh-pagination {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .bh-footer {
    margin-top: 22px;
    color: #496582;
    font-size: .85rem;
    text-align: center;
  }

  .bh-writing .wh-page > .wh-header,
  .bh-writing .wh-page > .wh-footer,
  .bh-writing .wh-heading .wh-eyebrow {
    display: none;
  }

  .bh-writing .wh-page {
    min-height: 0;
    background: transparent;
  }

  .bh-writing .wh-page > .wh-main {
    box-sizing: border-box;
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0;
  }

  @media (max-width: 600px) {
    .bh-hero::after {
      right: -15%;
      opacity: .55;
    }
  }

  @media (max-width: 420px) {
    .bh-tabs {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;

function formatDuration(seconds) {
  if (seconds == null) return '—';

  const value = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(value / 60);
  const remainder = String(value % 60).padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
  }).format(date);
}

function SkillHistory({ skill }) {
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState(null);

  const requestKey = `${offset}:${retry}`;
  const current = result?.key === requestKey ? result : null;
  const attempts = current?.attempts ?? [];

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getPracticeAttempts(skill.id, offset, PAGE_SIZE);
        const rows = Array.isArray(data) ? data : data?.items ?? data?.attempts;

        if (!Array.isArray(rows)) {
          throw new Error('Unexpected practice history response');
        }

        if (active) {
          setResult({
            key: requestKey,
            attempts: rows,
            hasMore: typeof data?.total === 'number'
              ? offset + rows.length < data.total
              : rows.length === PAGE_SIZE,
          });
        }
      } catch (error) {
        if (!active) return;

        if (error.response?.status === 401) {
          sessionStorage.removeItem('band_buddy_access_token');
          navigate('/login', { replace: true });
          return;
        }

        setResult({ key: requestKey, error: true });
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [skill.id, offset, requestKey, navigate]);

  return (
    <main className="bh-panel" aria-labelledby="bh-skill-heading">
      <div className="bh-panel-head">
        <h2 id="bh-skill-heading">{skill.label} history</h2>
        <Link className="bh-button" to={skill.path}>
          Start practice →
        </Link>
      </div>

      {!current && (
        <div className="bh-message" role="status">
          Loading practice history…
        </div>
      )}

      {current?.error && (
        <div className="bh-message">
          <p role="alert">Could not load practice history.</p>
          <button
            className="bh-button"
            type="button"
            onClick={() => setRetry((n) => n + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {current && !current.error && attempts.length === 0 && (
        <div className="bh-message">
          {offset === 0 ? (
            <>
              <p><strong>No {skill.label.toLowerCase()} attempts yet</strong></p>
              <p>Your saved practice will appear here.</p>
            </>
          ) : (
            <p>No more attempts.</p>
          )}
        </div>
      )}

      {attempts.length > 0 && (
        <ul className="bh-list">
          {attempts.map((attempt) => (
            <li className="bh-row" key={attempt.id}>
              <div>
                <strong>{attempt.title}</strong>
                <p className="bh-meta">
                  {formatDate(attempt.created_at)}
                  {' · Time: '}
                  {formatDuration(attempt.elapsed_seconds)}
                </p>
              </div>

              {skill.id !== 'speaking' && attempt.score != null && (
                <span className="bh-score">
                  {attempt.score}/{attempt.total_questions}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {current && !current.error && (offset > 0 || current.hasMore) && (
        <nav className="bh-pagination" aria-label="History pages">
          {offset > 0 && (
            <button
              className="bh-button"
              type="button"
              onClick={() => setOffset((n) => Math.max(0, n - PAGE_SIZE))}
            >
              ← Previous
            </button>
          )}

          {current.hasMore && (
            <button
              className="bh-button"
              type="button"
              onClick={() => setOffset((n) => n + PAGE_SIZE)}
            >
              Next →
            </button>
          )}
        </nav>
      )}
    </main>
  );
}

export default function WritingHistory() {
  const [selected, setSelected] = useState('writing');
  const skill = SKILLS.find((item) => item.id === selected);

  return (
    <div className="bh-page">
      <style>{styles}</style>

      <header className="bh-topbar">
        <div className="bh-topbar-inner">
          <Link
            className="bh-logo"
            to="/dashboard"
            aria-label="Band Buddy dashboard"
          >
            <img src="/images/logo.png" alt="Band Buddy" />
          </Link>

          <Link className="bh-button" to="/dashboard">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="bh-shell bh-body">
        <section className="bh-hero" aria-labelledby="bh-title">
          <p className="bh-kicker">YOUR LEARNING JOURNEY</p>
          <h1 id="bh-title">Practice history</h1>
          <p>Review your saved IELTS practice across all four skills.</p>
        </section>

        <nav className="bh-tabs" aria-label="Practice history skills">
          {SKILLS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === selected}
              onClick={() => setSelected(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {selected === 'writing' ? (
          <div className="bh-panel bh-writing">
            <WritingHistoryContent />
          </div>
        ) : (
          <SkillHistory key={skill.id} skill={skill} />
        )}

        <footer className="bh-footer">
          Band Buddy · Small steps. Meaningful progress.
        </footer>
      </div>
    </div>
  );
}