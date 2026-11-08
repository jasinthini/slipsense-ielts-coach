import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getWritingQuestions,
  getWritingAttempts,
  createWritingAttempt,
  updateWritingAttempt,
} from '../services/writing';
import './Writing.css';

const categories = {
  discussion: {
    label: 'Task 2 · Discussion essay',
    task: 'Task 2 · Essay',
    minutes: 40,
  },
  opinion: {
    label: 'Task 2 · Opinion essay',
    task: 'Task 2 · Essay',
    minutes: 40,
  },
  letters: {
    label: 'General Training · Task 1 · Letter',
    task: 'Task 1 · Letter',
    minutes: 20,
  },
  bar: {
    label: 'Academic · Task 1 · Bar chart',
    task: 'Task 1 · Bar chart',
    minutes: 20,
    visualLabel: 'Bar chart',
  },
  line: {
    label: 'Academic · Task 1 · Line graph',
    task: 'Task 1 · Line graph',
    minutes: 20,
    visualLabel: 'Line graph',
  },
  pie: {
  label: 'Academic · Task 1 · Pie chart',
  task: 'Task 1 · Pie chart',
  minutes: 20,
  visualLabel: 'Pie chart',
},
};

function questionUrl(category, questionId) {
  const params = new URLSearchParams({ category });
  if (questionId != null) params.set('question', String(questionId));
  return `?${params.toString()}`;
}

async function loadAllPages(fetchPage) {
  const items = [];
  let offset = 0;

  while (true) {
    const page = await fetchPage(offset);
    items.push(...page);
    if (page.length < 20) return items;
    offset += page.length;
  }
}

function WritingHeader({ onLeave }) {
  return (
    <header className="wp-header">
      <Link
        to="/dashboard"
        aria-label="Band Buddy dashboard"
        onClick={onLeave ? (event) => onLeave(event, '/dashboard') : undefined}
      >
        <img src="/images/logo.png" alt="Band Buddy" />
      </Link>

      <Link
        className="wp-back"
        to="/writing"
        onClick={onLeave ? (event) => onLeave(event, '/writing') : undefined}
      >
        ← Writing categories
      </Link>
    </header>
  );
}

function WritingFooter() {
  return (
    <footer className="wp-footer">
      Band Buddy · Small steps. Meaningful progress.
    </footer>
  );
}

function WritingQuestionCards({ category, questions, attempts, invalidQuestion }) {
  const { label, task, minutes } = categories[category];

  return (
    <div className="writing-page">
      <WritingHeader />

      <main className="wp-main">
        <div className="wp-heading">
          <div>
            <p className="wp-eyebrow">IELTS WRITING PRACTICE</p>
            <h1>Choose a question.</h1>
            <p>{label} · {questions.length} {questions.length === 1 ? 'question' : 'questions'}</p>
          </div>
        </div>

        {invalidQuestion && (
          <p className="wp-notice" role="status">
            That question is unavailable. Choose another question below.
          </p>
        )}

        <div className="wp-question-grid">
          {questions.map((question, index) => {
            const hasDraft = attempts.some(
              (attempt) =>
                String(attempt.question_id) === String(question.id) &&
                attempt.status === 'draft'
            );

            return (
              <article className="wp-question-card" key={question.id}>
                <span className="wp-card-tag">Writing</span>
                <p className="wp-card-label">{task} · Practice {index + 1}</p>
                <h2>{question.title}</h2>

                <div className="wp-card-meta">
                  <span>Suggested: {minutes} min</span>
                  <span>1 question</span>
                </div>

                <Link
                  className="wp-card-start"
                  to={questionUrl(category, question.id)}
                  aria-label={`${hasDraft ? 'Continue draft' : 'Start practice'}: ${question.title}`}
                >
                  {hasDraft ? 'Continue draft →' : 'Start practice →'}
                </Link>
              </article>
            );
          })}
        </div>

        <WritingFooter />
      </main>
    </div>
  );
}

export default function Writing() {
  const [params] = useSearchParams();
  const category = params.get('category') || 'discussion';

  if (!Object.hasOwn(categories, category)) {
    return (
      <main className="wp-loading">
        <h1>Choose an available writing category.</h1>
        <Link to="/writing">← Writing categories</Link>
      </main>
    );
  }

  return (
    <WritingWorkspace
      key={category}
      category={category}
      questionId={params.get('question')}
    />
  );
}

function WritingWorkspace({ category, questionId }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!sessionStorage.getItem('band_buddy_access_token')) {
      navigate('/login', { replace: true });
      return;
    }

    let active = true;
    setQuestions(null);
    setError('');

    async function loadWorkspace() {
      try {
        const [questionList, attemptList] = await Promise.all([
          loadAllPages((offset) => getWritingQuestions(category, offset)),
          loadAllPages((offset) => getWritingAttempts(offset)),
        ]);

        if (!active) return;
        setQuestions(questionList);
        setAttempts(attemptList);
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 401) {
          sessionStorage.removeItem('band_buddy_access_token');
          navigate('/login', { replace: true });
        } else {
          const detail = err.response?.data?.detail;
          setError(
            typeof detail === 'string'
              ? detail
              : 'Could not load your writing practice. Please try again.'
          );
        }
      }
    }

    loadWorkspace();

    return () => {
      active = false;
    };
  }, [category, navigate, retry]);

  if (questions === null) {
    return (
      <main className="wp-loading">
        <img src="/images/logo.png" alt="Band Buddy" />
        <p role={error ? 'alert' : 'status'}>
          {error || 'Loading your questions and saved drafts…'}
        </p>

        {error && (
          <button
            type="button"
            className="wp-primary"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        )}

        <Link to="/writing">← Writing categories</Link>
      </main>
    );
  }

  if (!questions.length) {
    return (
      <main className="wp-loading">
        <h1>No questions available yet.</h1>
        <p>Questions for this category are being prepared.</p>
        <Link to="/writing">← Writing categories</Link>
      </main>
    );
  }

  const index = questions.findIndex(
    (question) => String(question.id) === questionId
  );

  if (index === -1) {
    return (
      <WritingQuestionCards
        category={category}
        questions={questions}
        attempts={attempts}
        invalidQuestion={questionId !== null}
      />
    );
  }

  const question = questions[index];
  const savedDraft = attempts.find(
    (attempt) =>
      String(attempt.question_id) === String(question.id) &&
      attempt.status === 'draft'
  );

  function rememberAttempt(saved) {
    setAttempts((current) => [
      saved,
      ...current.filter((attempt) => attempt.id !== saved.id),
    ]);
  }

  function openNextQuestion() {
    const nextQuestion = questions[index + 1];
    if (nextQuestion) navigate(questionUrl(category, nextQuestion.id));
  }

  return (
    <WritingEditor
      key={question.id}
      category={category}
      question={question}
      number={index + 1}
      total={questions.length}
      savedDraft={savedDraft}
      onSaved={rememberAttempt}
      onNext={openNextQuestion}
    />
  );
}

function WritingEditor({
  category,
  question,
  number,
  total,
  savedDraft,
  onSaved,
  onNext,
}) {
  const navigate = useNavigate();
  const [answer, setAnswer] = useState(savedDraft?.answer || '');
  const [seconds, setSeconds] = useState(savedDraft?.elapsed_seconds || 0);
  const [attemptId, setAttemptId] = useState(savedDraft?.id || null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState(
    savedDraft ? 'Your saved draft has been restored.' : ''
  );
  const [error, setError] = useState('');

  const saveLock = useRef(false);
  const mounted = useRef(true);
  const dirtyRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!running || submitted) return;

    const interval = window.setInterval(() => {
      setSeconds((value) => value + 1);
      setDirty(true);
      dirtyRef.current = true;
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running, submitted]);

  useEffect(() => {
    function warnBeforeLeaving(event) {
      if (!dirtyRef.current && !saveLock.current) return;
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, []);

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const clock = [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');

  async function persist(status = 'draft') {
    if (saveLock.current) return false;
    if (submitted) return true;

    if (status === 'submitted' && !answer.trim()) {
      setError('Write an answer before submitting.');
      return false;
    }

    saveLock.current = true;
    setSaving(true);
    setRunning(false);
    setError('');
    setMessage('');

    try {
      const payload = {
        questionId: question.id,
        answer,
        elapsedSeconds: seconds,
        status,
      };

      const saved = attemptId
        ? await updateWritingAttempt(attemptId, payload)
        : await createWritingAttempt(payload);

      if (!mounted.current) return false;

      onSaved(saved);
      setAttemptId(saved.id);
      setDirty(false);
      dirtyRef.current = false;

      if (status === 'submitted') {
        setSubmitted(true);
        setMessage('Answer submitted and saved. AI feedback is not available yet.');
      } else {
        setMessage('Draft saved to your account.');
      }

      return true;
    } catch (err) {
      if (!mounted.current) return false;

      if (err.response?.status === 401) {
        setError('Your login has expired. Copy your answer before logging in again.');
      } else if (err.response?.status === 409) {
        setError('This answer has already been submitted. Copy any unsaved changes before leaving.');
      } else {
        const detail = err.response?.data?.detail;
        setError(
          typeof detail === 'string'
            ? detail
            : 'Could not save your answer. Your text is still here. Please try again.'
        );
      }

      return false;
    } finally {
      saveLock.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  function leavePage(event, destination) {
    event.preventDefault();
    if (saveLock.current) return;

    if (
      dirtyRef.current &&
      !window.confirm('You have unsaved changes. Leave without saving them?')
    ) {
      return;
    }

    navigate(destination);
  }

  async function handleNext() {
    if (number >= total || saveLock.current) return;

    if (!submitted && dirtyRef.current) {
      const saved = await persist('draft');
      if (!saved) return;
    }

    setRunning(false);
    onNext();
  }

  function startNewAttempt() {
    setAnswer('');
    setSeconds(0);
    setAttemptId(null);
    setSubmitted(false);
    setRunning(false);
    setDirty(false);
    dirtyRef.current = false;
    setError('');
    setMessage('New attempt ready. Your submitted answer stays saved.');
  }

  const questionListUrl = questionUrl(category);
  const { label, visualLabel = 'Question visual' } = categories[category];

  return (
    <div className="writing-page">
      <WritingHeader onLeave={leavePage} />

      <main className="wp-main">
        <div className="wp-heading">
          <div>
            <p className="wp-eyebrow">ONE IDEA AT A TIME</p>
            <h1>Your writing workspace.</h1>
            <p>{label}</p>
          </div>

          <span className="wp-mode">
            {submitted ? 'Submitted' : 'Practice mode'}
          </span>
        </div>

        <section className="wp-toolbar" aria-label="Practice controls">
          <Link
            className="wp-text-button"
            to={questionListUrl}
            onClick={(event) => leavePage(event, questionListUrl)}
          >
            ← All questions
          </Link>

          <Link
            className="wp-text-button"
            to="/writing/history"
            onClick={(event) => leavePage(event, '/writing/history')}
          >
            My writing history →
          </Link>

          <div className="wp-timer">
            <span aria-label="Elapsed practice time">{clock}</span>
            <button
              type="button"
              disabled={saving || submitted}
              onClick={() => setRunning((value) => !value)}
            >
              {running ? 'Pause timer' : 'Start timer'}
            </button>
          </div>
        </section>

        <div className="wp-workspace">
          <aside className="wp-question-panel">
            <div className="wp-question-meta">
              <span>{label}</span>
              <small>Question {number} of {total}</small>
            </div>

            <p className="wp-eyebrow">YOUR QUESTION</p>
            <h2>{question.title}</h2>
            <p className="wp-prompt">{question.prompt}</p>

            {question.visual_url && (
              <figure style={{ margin: '16px 0' }}>
                <a
                  href={question.visual_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${visualLabel.toLowerCase()} for ${question.title} in a new tab`}
                >
                  <img
                    src={question.visual_url}
                    alt={`${visualLabel}: ${question.title}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      boxSizing: 'border-box',
                      border: '1px solid #d3e4f2',
                      borderRadius: 12,
                    }}
                  />
                </a>
                <figcaption style={{ marginTop: 8 }}>
                  Click the image to view it full size.
                </figcaption>
              </figure>
            )}

            {question.points?.length > 0 && (
              <ul className="wp-points">
                {question.points.map((point, pointIndex) => (
                  <li key={`${question.id}-${pointIndex}`}>{point}</li>
                ))}
              </ul>
            )}

            <div className="wp-question-note">
              <strong>Before you begin</strong>
              <p>
                Read the question carefully. Plan your answer and leave
                time to review your ideas, grammar and vocabulary.
              </p>
            </div>

            <div className="wp-sample-note">
              Band Buddy practice question. Not an official IELTS paper.
            </div>
          </aside>

          <section className="wp-editor-panel" aria-labelledby="answer-heading">
            <div className="wp-editor-heading">
              <div>
                <h2 id="answer-heading">Your answer</h2>
                <p>
                  {submitted
                    ? 'This submitted answer is now read-only.'
                    : 'Save your draft before leaving this page.'}
                </p>
              </div>

              <span className="wp-word-count">{wordCount} words</span>
            </div>

            <label className="wp-sr-only" htmlFor="writing-answer">
              Write your answer
            </label>

            <textarea
              id="writing-answer"
              value={answer}
              maxLength={50000}
              readOnly={submitted}
              disabled={saving}
              onChange={(event) => {
                setAnswer(event.target.value);
                setDirty(true);
                dirtyRef.current = true;
                setMessage('');
                setError('');
              }}
              placeholder="Start writing your answer here…"
              spellCheck
              aria-describedby="draft-status"
            />

            <div className="wp-editor-footer">
              <p id="draft-status" role="status">
                {saving
                  ? 'Saving your answer…'
                  : submitted
                    ? 'Submitted answer saved.'
                    : dirty
                      ? 'Unsaved changes.'
                      : attemptId
                        ? 'Draft saved to your account.'
                        : 'Click Save draft to save to your account.'}
              </p>

              <button
                type="button"
                className="wp-text-button"
                disabled={saving || submitted}
                onClick={() => persist('draft')}
              >
                {saving ? 'Saving…' : 'Save draft'}
              </button>
            </div>
          </section>
        </div>

        <div className="wp-bottom-bar">
          <p>
            {number < total
              ? 'Next question saves any unsaved draft before moving on.'
              : 'You have reached the last available question in this category.'}
          </p>

          <div className="wp-actions">
            {submitted ? (
              <button type="button" className="wp-secondary" onClick={startNewAttempt}>
                New attempt
              </button>
            ) : (
              <button
                type="button"
                className="wp-secondary"
                disabled={saving || !answer.trim()}
                onClick={() => persist('submitted')}
              >
                {saving ? 'Saving…' : 'Submit answer'}
              </button>
            )}

            <button
              type="button"
              className="wp-primary"
              disabled={saving || number >= total}
              onClick={handleNext}
            >
              Next question <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {error && <p className="wp-notice" role="alert">{error}</p>}
        {message && <p className="wp-notice" role="status">{message}</p>}

        <WritingFooter />
      </main>
    </div>
  );
}