import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getWritingAttempts,
  getWritingAttempt,
  getWritingAttemptQuestion,
  updateWritingAttempt,
} from '../services/writing';
import './WritingHistory.css';

const PAGE_SIZE = 20;
const TOKEN_KEY = 'band_buddy_access_token';

const FILTERS = [
  ['all', 'All'],
  ['draft', 'Drafts'],
  ['submitted', 'Submitted'],
];

const summaryStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
  gap: 12,
  margin: '0 0 24px',
};

const summaryCardStyle = {
  background: '#f0f7fd',
  border: '1px solid #cddff0',
  borderRadius: 14,
  padding: '14px 18px',
  color: '#102e4a',
};

function formatDate(value, dateOnly = false) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return dateOnly
    ? date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : date.toLocaleString();
}

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function sortAttempts(items) {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.updated_at || a.created_at) || 0;
    const bTime = Date.parse(b.updated_at || b.created_at) || 0;
    return bTime - aTime || b.id - a.id;
  });
}

function previewAnswer(answer) {
  const text = answer?.trim().replace(/\s+/g, ' ');
  if (!text) return 'No answer written yet.';
  return text.length > 200 ? `${text.slice(0, 200).trimEnd()}…` : text;
}

function HistorySummary({ counts, lastActivity }) {
  const stats = [
    ['Total attempts', counts.all],
    ['Saved drafts', counts.draft],
    ['Submitted', counts.submitted],
    ['Last activity', formatDate(lastActivity, true)],
  ];

  return (
    <dl style={summaryStyle} aria-label="Writing practice summary">
      {stats.map(([label, value]) => (
        <div key={label} style={summaryCardStyle}>
          <dt style={{ fontSize: 14, color: '#466781' }}>{label}</dt>
          <dd style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700 }}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function WritingHistory() {
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [questions, setQuestions] = useState({});
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!sessionStorage.getItem(TOKEN_KEY)) {
      navigate('/login', { replace: true });
      return;
    }

    let active = true;

    async function loadHistory() {
      setLoading(true);
      setError('');

      try {
        const items = new Map();
        let offset = 0;

        while (active) {
          const batch = await getWritingAttempts(offset);
          if (!active) return;

          const previousSize = items.size;
          batch.forEach((item) => items.set(item.id, item));

          if (batch.length < PAGE_SIZE || items.size === previousSize) break;
          offset += batch.length;
        }

        setAttempts(sortAttempts([...items.values()]));
        setQuestions({});
        setPage(0);
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
          navigate('/login', { replace: true });
        } else {
          setError('Could not load your writing history. Please try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      active = false;
    };
  }, [navigate, retry]);

  const counts = {
    all: attempts.length,
    draft: attempts.filter((item) => item.status === 'draft').length,
    submitted: attempts.filter((item) => item.status === 'submitted').length,
  };

  const filtered = attempts.filter(
    (item) => filter === 'all' || item.status === filter
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const missingIds = visible
    .filter((item) => !Object.hasOwn(questions, item.id))
    .map((item) => item.id)
    .join(',');

  useEffect(() => {
    if (loading || error || !missingIds) return;

    let active = true;

    async function loadQuestions() {
      try {
        const entries = await Promise.all(
          missingIds.split(',').map(async (id) => {
            try {
              return [id, await getWritingAttemptQuestion(Number(id))];
            } catch (err) {
              if (err.response?.status === 401) throw err;
              return [id, null];
            }
          })
        );

        if (active) {
          setQuestions((current) => ({
            ...current,
            ...Object.fromEntries(entries),
          }));
        }
      } catch (err) {
        if (active && err.response?.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
          navigate('/login', { replace: true });
        }
      }
    }

    loadQuestions();
    return () => {
      active = false;
    };
  }, [missingIds, loading, error, navigate]);

  function rememberSaved(saved) {
    setAttempts((current) => sortAttempts(
      current.map((item) => item.id === saved.id ? { ...item, ...saved } : item)
    ));
  }

  return (
    <div className="wh-page">
      <header className="wh-header">
        <div className="wh-shell wh-navigation">
          <Link to="/dashboard" aria-label="Band Buddy dashboard">
            <img src="/images/logo.png" alt="Band Buddy" />
          </Link>
          <Link to="/dashboard">← Back to dashboard</Link>
        </div>
      </header>

      <main className="wh-shell wh-main">
        <div className="wh-heading">
          <div>
            <p className="wh-eyebrow">YOUR LEARNING JOURNEY</p>
            <h1>Writing history</h1>
            <p>Continue your drafts and revisit your submitted answers.</p>
          </div>
          <Link className="wh-button" to="/writing">New practice →</Link>
        </div>

        {!loading && !error && (
          <>
            <HistorySummary
              counts={counts}
              lastActivity={attempts[0]?.updated_at || attempts[0]?.created_at}
            />

            <div
              role="group"
              aria-label="Filter writing history"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}
            >
              {FILTERS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={filter === value ? 'wh-button' : 'wh-button wh-outline'}
                  aria-pressed={filter === value}
                  onClick={() => {
                    setFilter(value);
                    setPage(0);
                  }}
                >
                  {label} ({counts[value]})
                </button>
              ))}
            </div>
          </>
        )}

        {loading ? (
          <p role="status">Loading your writing history…</p>
        ) : error ? (
          <div className="wh-panel" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="wh-button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <section className="wh-panel wh-empty">
            <h2>
              {filter === 'draft' ? 'No saved drafts yet.'
                : filter === 'submitted' ? 'No submitted answers yet.'
                  : 'Your first answer starts here.'}
            </h2>
            <p>
              {filter === 'submitted'
                ? 'Your submitted writing answers will appear here.'
                : 'Choose a writing question and save your answer to begin.'}
            </p>
            <Link className="wh-button" to="/writing">Open writing practice →</Link>
          </section>
        ) : (
          <>
            <p className="wh-help" role="status">
              Showing {start + 1}–{start + visible.length} of {filtered.length} answers
            </p>

            <div className="wh-list">
              {visible.map((attempt) => {
                const isDraft = attempt.status === 'draft';

                return (
                  <article className="wh-panel wh-attempt" key={attempt.id}>
                    <div>
                      <span className="wh-badge">{isDraft ? 'Draft' : 'Submitted'}</span>
                      <h2>
                        {questions[attempt.id]?.title || `Question ${attempt.question_id}`}
                      </h2>
                      <p className="wh-preview">{previewAnswer(attempt.answer)}</p>
                      <div className="wh-meta">
                        <span>{attempt.word_count ?? 0} words</span>
                        <span>{formatTime(attempt.elapsed_seconds)}</span>
                        <span>Updated: {formatDate(attempt.updated_at || attempt.created_at)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="wh-button wh-outline"
                      onClick={() => setSelectedId(attempt.id)}
                    >
                      {isDraft ? 'Continue draft' : 'Review answer'}
                    </button>
                  </article>
                );
              })}
            </div>

            {pageCount > 1 && (
              <nav className="wh-pagination" aria-label="History pages">
                <button
                  type="button"
                  className="wh-button wh-outline"
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  ← Previous
                </button>
                <span>Page {currentPage + 1} of {pageCount}</span>
                <button
                  type="button"
                  className="wh-button wh-outline"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </main>

      <footer className="wh-footer">
        Band Buddy · Small steps. Meaningful progress.
      </footer>

      {selectedId !== null && (
        <SavedAnswer
          key={selectedId}
          attemptId={selectedId}
          onClose={() => setSelectedId(null)}
          onSaved={rememberSaved}
        />
      )}
    </div>
  );
}

function SavedAnswer({ attemptId, onClose, onSaved }) {
  const [attempt, setAttempt] = useState(null);
  const [question, setQuestion] = useState(null);
  const [questionError, setQuestionError] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);

  const dialogRef = useRef(null);
  const savingRef = useRef(false);

  const readOnly = attempt?.status !== 'draft';
  const dirty = !readOnly && answer !== (attempt.answer ?? '');
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog.showModal();

    return () => {
      dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAnswer() {
      setLoading(true);
      setError('');
      setQuestionError('');
      setQuestion(null);

      try {
        const saved = await getWritingAttempt(attemptId);
        if (!active) return;

        setAttempt(saved);
        setAnswer(saved.answer ?? '');

        try {
          const original = await getWritingAttemptQuestion(attemptId);
          if (active) setQuestion(original);
        } catch {
          if (active) {
            setQuestionError('The question could not be loaded. Your saved answer is shown below.');
          }
        }
      } catch (err) {
        if (!active) return;

        const status = err.response?.status;
        setError(
          status === 401 ? 'Your login has expired. Please log in again.'
            : status === 404 ? 'This answer could not be found.'
              : 'Could not open this answer. Please try again.'
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAnswer();
    return () => {
      active = false;
    };
  }, [attemptId, retry]);

  useEffect(() => {
    if (!dirty && !saving) return;

    function warnBeforeLeaving(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [dirty, saving]);

  function closeAnswer() {
    if (savingRef.current) return;
    if (dirty && !window.confirm('You have unsaved changes. Close without saving?')) return;
    onClose();
  }

  async function saveAnswer(status) {
    if (!attempt || readOnly || savingRef.current) return;

    if (status === 'submitted') {
      if (!answer.trim()) {
        setError('Write an answer before submitting.');
        return;
      }

      if (!window.confirm('After submitting, this answer cannot be edited. Submit now?')) {
        return;
      }
    }

    savingRef.current = true;
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const saved = await updateWritingAttempt(attempt.id, {
        questionId: attempt.question_id,
        answer,
        elapsedSeconds: attempt.elapsed_seconds,
        status,
      });

      const updated = { ...attempt, ...saved };
      setAttempt(updated);
      setAnswer(updated.answer ?? '');
      onSaved(updated);
      setMessage(
        updated.status === 'draft'
          ? 'Your draft has been saved.'
          : 'Your answer has been submitted and saved.'
      );
    } catch (err) {
      const statusCode = err.response?.status;
      setError(
        statusCode === 401
          ? 'Your login has expired. Copy your answer before logging in again.'
          : statusCode === 409
            ? 'This draft can no longer be edited. Copy your changes before closing.'
            : 'Could not save your answer. Your text is still here.'
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="wh-dialog"
      aria-labelledby="wh-answer-title"
      onCancel={(event) => {
        event.preventDefault();
        closeAnswer();
      }}
    >
      <div className="wh-dialog-heading">
        <h2 id="wh-answer-title">
          {!attempt ? 'Saved writing answer' : readOnly ? 'Review answer' : 'Continue draft'}
        </h2>
        <button
          type="button"
          className="wh-button wh-outline"
          disabled={saving}
          onClick={closeAnswer}
        >
          Close
        </button>
      </div>

      {loading ? (
        <p role="status">Loading your answer and question…</p>
      ) : !attempt ? (
        <>
          <p role="alert">{error}</p>
          <button
            type="button"
            className="wh-button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </>
      ) : (
        <>
          {question ? (
            <section
              aria-labelledby="wh-question-title"
              style={{
                padding: 20,
                marginBottom: 24,
                background: '#edf6ff',
                border: '1px solid #d1e4fa',
                borderRadius: 14,
              }}
            >
              <p className="wh-help">ORIGINAL QUESTION</p>
              <h3 id="wh-question-title">{question.title}</h3>
              <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {question.prompt}
              </p>
              {question.points?.length > 0 && (
                <ul>
                  {question.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              )}
              <p className="wh-help">
                Band Buddy practice question. Not an official IELTS paper.
              </p>
            </section>
          ) : (
            <p className="wh-help" role="status">{questionError}</p>
          )}

          <p>{wordCount} words · {readOnly ? 'Submitted answer' : 'Draft'}</p>
          <p className="wh-help">
            {readOnly
              ? 'This submitted answer is read-only.'
              : 'Continue editing your saved answer below.'}
          </p>

          <label htmlFor="wh-answer" className="wh-label">Your answer</label>
          <textarea
            id="wh-answer"
            className="wh-answer"
            value={answer}
            maxLength={50000}
            readOnly={readOnly}
            disabled={saving}
            spellCheck
            onChange={(event) => {
              setAnswer(event.target.value);
              setError('');
              setMessage('');
            }}
          />

          {error && <p role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}

          {!readOnly && (
            <div className="wh-dialog-actions">
              <span role="status">
                {saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'}
              </span>
              <button
                type="button"
                className="wh-button wh-outline"
                disabled={saving || !dirty}
                onClick={() => saveAnswer('draft')}
              >
                Save draft
              </button>
              <button
                type="button"
                className="wh-button"
                disabled={saving || !answer.trim()}
                onClick={() => saveAnswer('submitted')}
              >
                Submit answer
              </button>
            </div>
          )}
        </>
      )}
    </dialog>
  );
}