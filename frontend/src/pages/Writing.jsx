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
  map: {
    label: 'Academic · Task 1 · Maps',
    task: 'Task 1 · Maps',
    minutes: 20,
    visualLabel: 'Maps',
  },
  process: {
    label: 'Academic · Task 1 · Process diagram',
    task: 'Task 1 · Process diagram',
    minutes: 20,
    visualLabel: 'Process diagram',
  },
  table: {
    label: 'Academic · Task 1 · Table',
    task: 'Task 1 · Table',
    minutes: 20,
    visualLabel: 'Table',
  },
};

function questionUrl(category, questionId, attemptId) {
  const params = new URLSearchParams({ category });
  if (questionId != null) params.set('question', String(questionId));
  if (attemptId != null) params.set('attempt', String(attemptId));
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
            const questionAttempts = attempts.filter(
              (attempt) => String(attempt.question_id) === String(question.id)
            );
            const hasDraft = questionAttempts.some((attempt) => attempt.status === 'draft');
            const latestFeedback = questionAttempts.find(
              (attempt) => attempt.status === 'submitted' && attempt.feedback
            );
            const action = hasDraft ? 'Continue draft' : 'Start practice';

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
                  aria-label={`${action}: ${question.title}`}
                >
                  {action} →
                </Link>

                {latestFeedback && (
                  <Link
                    className="wp-text-button"
                    to={questionUrl(category, question.id, latestFeedback.id)}
                  >
                    View latest feedback →
                  </Link>
                )}
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
      reviewAttemptId={params.get('attempt')}
    />
  );
}

function WritingWorkspace({ category, questionId, reviewAttemptId }) {
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
    return () => { active = false; };
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

  const index = questions.findIndex((question) => String(question.id) === questionId);

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
  const reviewAttempt = attempts.find(
    (attempt) =>
      String(attempt.id) === reviewAttemptId &&
      String(attempt.question_id) === String(question.id) &&
      attempt.status === 'submitted'
  );
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
      key={`${question.id}:${reviewAttemptId ?? 'practice'}`}
      category={category}
      question={question}
      number={index + 1}
      total={questions.length}
      savedAttempt={reviewAttempt || savedDraft}
      onSaved={rememberAttempt}
      onNext={openNextQuestion}
    />
  );
}

function WritingEditor({ category, question, number, total, savedAttempt, onSaved, onNext }) {
  const navigate = useNavigate();
  const [answer, setAnswer] = useState(savedAttempt?.answer || '');
  const [seconds, setSeconds] = useState(savedAttempt?.elapsed_seconds || 0);
  const [attemptId, setAttemptId] = useState(savedAttempt?.id ?? null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(savedAttempt?.status === 'submitted');
  const [feedback, setFeedback] = useState(savedAttempt?.feedback ?? null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState(
    savedAttempt?.status === 'draft' ? 'Your saved draft has been restored.' : ''
  );
  const [error, setError] = useState('');

  const saveLock = useRef(false);
  const mounted = useRef(true);
  const dirtyRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
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
  ].map((value) => String(value).padStart(2, '0')).join(':');

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
        setFeedback(saved.feedback ?? null);
        setMessage(
          saved.feedback
            ? 'Answer submitted and saved.'
            : 'Answer submitted and saved. AI feedback was not returned for this attempt.'
        );
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
    ) return;
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
    setFeedback(null);
    setSubmitted(false);
    setRunning(false);
    setDirty(false);
    dirtyRef.current = false;
    setError('');
    setMessage('New attempt ready. Your submitted answer stays saved.');
  }

  const questionListUrl = questionUrl(category);
  const { label, visualLabel = 'Question visual' } = categories[category];
  const draftStatus = saving
    ? 'Saving your answer…'
    : submitted
      ? 'Submitted answer saved.'
      : dirty
        ? 'Unsaved changes.'
        : attemptId
          ? 'Draft saved to your account.'
          : 'Click Save draft to save to your account.';

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
          <span className="wp-mode">{submitted ? 'Submitted' : 'Practice mode'}</span>
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
              <p id="draft-status" role="status">{draftStatus}</p>
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
        {submitted && feedback && <WritingFeedbackPanel feedback={feedback} />}

        <WritingFooter />
      </main>
    </div>
  );
}

function WritingFeedbackPanel({ feedback }) {
  const textSections = [
    ['Summary', feedback.summary],
    ['Task feedback', feedback.task_feedback],
    ['Organisation', feedback.structure_feedback],
  ];

  const listSections = [
    ['Strengths', feedback.strengths],
    ['What to improve', feedback.improvements],
  ];

  const grammar = Array.isArray(feedback.grammar_corrections)
    ? feedback.grammar_corrections : [];
  const vocabulary = Array.isArray(feedback.vocabulary_suggestions)
    ? feedback.vocabulary_suggestions : [];

  return (
    <section
      aria-labelledby="wp-feedback-title"
      style={{
        marginBlock: '24px',
        padding: 'clamp(16px, 3vw, 28px)',
        background: '#fff',
        color: '#102f4a',
        border: '1px solid #c8ddf0',
        borderRadius: '16px',
        overflowWrap: 'anywhere',
      }}
    >
      <h2 id="wp-feedback-title">AI writing feedback</h2>
      <p>Practice guidance for your submitted answer.</p>

      {textSections.map(([title, text]) => text && (
        <div key={title}>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      ))}

      {listSections.map(([title, items]) => Array.isArray(items) && items.length > 0 && (
        <div key={title}>
          <h3>{title}</h3>
          <ul>
            {items.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      ))}

      {grammar.length > 0 && (
        <div>
          <h3>Grammar corrections</h3>
          <ol>
            {grammar.map((item, index) => (
              <li key={index}>
                <p><strong>Original:</strong> {item.original}</p>
                <p><strong>Corrected:</strong> {item.corrected}</p>
                {item.explanation && <p>{item.explanation}</p>}
                {item.tamil_explanation && <p lang="ta">{item.tamil_explanation}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {vocabulary.length > 0 && (
        <div>
          <h3>Vocabulary suggestions</h3>
          <ol>
            {vocabulary.map((item, index) => (
              <li key={index}>
                <p><strong>Original:</strong> {item.original}</p>
                <p><strong>Suggested wording:</strong> {item.suggestion}</p>
                {item.meaning && <p><strong>Meaning:</strong> {item.meaning}</p>}
                {item.example_sentence && <p><strong>Example:</strong> {item.example_sentence}</p>}
                {item.tamil_explanation && <p lang="ta">{item.tamil_explanation}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {feedback.tamil_summary && (
        <div lang="ta">
          <h3>தமிழில் சுருக்கம்</h3>
          <p>{feedback.tamil_summary}</p>
        </div>
      )}
    </section>
  );
}