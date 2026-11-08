import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { savePracticeAttempt } from '../services/practiceHistory';
import './Reading.css';

const TRUE_FALSE = ['True', 'False', 'Not given'];

const PASSAGES = [
  {
    id: 'community-library',
    title: 'A new chapter for a community library',
    paragraphs: [
      'When the fictional town of Willow Bay reviewed its library service, staff noticed that many residents wanted more than a place to borrow books. Students needed quiet study areas, while older residents asked for help using online services. The library team decided to redesign the building around these needs.',
      'The redesigned library opened in September. Its first floor became a quiet study space with individual desks. The ground floor remained a place for borrowing books and meeting other readers. Staff introduced free digital skills sessions every Wednesday afternoon. Residents could learn how to send emails, complete online forms and use the library catalogue.',
      'Not every change required expensive equipment. Volunteers created a book exchange shelf near the entrance. Readers could leave a book they no longer needed and take another one home. The shelf operated separately from the main borrowing system, so readers did not need a library card to use it.',
      'After six months, staff found that visits had increased. However, they did not measure success by visitor numbers alone. They also collected comments from residents. Several people said that the digital skills sessions had helped them become more independent. The team planned to keep asking residents for ideas before making further changes.',
    ],
    questions: [
      {
        prompt: 'Why did the library team redesign the building?',
        options: ['To sell more books', 'To respond to residents’ needs', 'To reduce its opening hours'],
        answer: 'To respond to residents’ needs',
        explanation: 'Paragraph A describes the needs of students and older residents.',
      },
      {
        prompt: 'Use ONE WORD: Digital skills sessions took place every ______ afternoon.',
        answer: 'Wednesday',
        explanation: 'Paragraph B says that the sessions took place every Wednesday afternoon.',
      },
      {
        prompt: 'Readers needed a library card to use the book exchange shelf.',
        options: TRUE_FALSE,
        answer: 'False',
        explanation: 'Paragraph C says that readers did not need a library card.',
      },
      {
        prompt: 'The library employed five additional members of staff.',
        options: TRUE_FALSE,
        answer: 'Not given',
        explanation: 'The passage does not say whether the library hired more staff.',
      },
      {
        prompt: 'How did staff evaluate the redesigned library?',
        options: [
          'Only by counting visitors',
          'Only by counting borrowed books',
          'By looking at visits and residents’ comments',
        ],
        answer: 'By looking at visits and residents’ comments',
        explanation: 'Paragraph D mentions both visitor numbers and residents’ comments.',
      },
    ],
  },
  {
    id: 'workplace-garden',
    title: 'The garden above the office',
    paragraphs: [
      'At the fictional company Northbridge Design, an unused roof terrace became the focus of a staff project. Employees suggested turning it into a small garden where they could spend part of their lunch break. The management team agreed to a six-month trial.',
      'Before work began, a building specialist checked the terrace. The project team then chose lightweight containers rather than deep planting beds. They planted herbs and small flowering plants. A rainwater tank supplied some of the water, although staff still used tap water during dry periods.',
      'Participation was voluntary. A group of twelve employees shared the gardening tasks, but all staff could visit the terrace. No one was expected to work in the garden during their lunch break. People could simply sit there, read or talk with colleagues.',
      'At the end of the trial, the company asked staff for feedback. Many visitors described the terrace as a pleasant place to take a break. The company did not measure changes in productivity, so the project team avoided claiming that the garden improved work performance. Instead, they recommended keeping the garden because staff valued the space.',
    ],
    questions: [
      {
        prompt: 'What was the original purpose of the garden project?',
        options: [
          'To create a place for staff breaks',
          'To grow food for sale',
          'To replace the office meeting rooms',
        ],
        answer: 'To create a place for staff breaks',
        explanation: 'Paragraph A says employees wanted a place to spend part of their lunch break.',
      },
      {
        prompt: 'Use ONE WORD: The team chose lightweight ______ for the plants.',
        answer: 'containers',
        explanation: 'Paragraph B says the team chose lightweight containers.',
      },
      {
        prompt: 'Only the twelve gardening volunteers could visit the terrace.',
        options: TRUE_FALSE,
        answer: 'False',
        explanation: 'Paragraph C says all staff could visit the terrace.',
      },
      {
        prompt: 'The company measured whether staff became more productive.',
        options: TRUE_FALSE,
        answer: 'False',
        explanation: 'Paragraph D says the company did not measure changes in productivity.',
      },
      {
        prompt: 'The terrace was open to the public at weekends.',
        options: TRUE_FALSE,
        answer: 'Not given',
        explanation: 'The passage does not mention public access or weekend opening.',
      },
    ],
  },
];

function normalise(value = '') {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function formatClock(seconds) {
  return [Math.floor(seconds / 60), seconds % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export default function Reading() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [notice, setNotice] = useState('');

  const startedAt = useRef(null);
  const elapsed = useRef(0);
  const questionsRef = useRef(null);
  const savingRef = useRef(false);

  const passage = PASSAGES[index];
  const total = passage.questions.length;
  const answered = passage.questions.filter((_, i) => normalise(answers[i])).length;
  const hasWork = answered > 0 || running || seconds > 0 || Boolean(result);
  const unsaved = hasWork && saveStatus !== 'saved';

  useEffect(() => {
    if (!sessionStorage.getItem('band_buddy_access_token')) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      if (startedAt.current !== null) {
        setSeconds(Math.floor((elapsed.current + Date.now() - startedAt.current) / 1000));
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!unsaved) return;

    function warn(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  function startTimer() {
    if (startedAt.current !== null) return;
    startedAt.current = Date.now();
    setRunning(true);
  }

  function stopTimer() {
    if (startedAt.current !== null) {
      elapsed.current += Date.now() - startedAt.current;
      startedAt.current = null;
    }

    const duration = Math.floor(elapsed.current / 1000);
    setSeconds(duration);
    setRunning(false);
    return duration;
  }

  function updateAnswer(i, value) {
    if (!result && elapsed.current === 0) startTimer();
    setAnswers((current) => ({ ...current, [i]: value }));
    setNotice('');
  }

  function confirmClear() {
    if (savingRef.current) return false;
    return !unsaved || window.confirm('This practice is not saved. Leave or clear it anyway?');
  }

  function clearPractice(nextIndex = index) {
    if (!confirmClear()) return;

    startedAt.current = null;
    elapsed.current = 0;
    setIndex(nextIndex);
    setAnswers({});
    setResult(null);
    setSaveStatus('idle');
    setSeconds(0);
    setRunning(false);
    setNotice('');

    if (questionsRef.current) questionsRef.current.scrollTop = 0;
  }

  function leavePage(event, destination) {
    event.preventDefault();
    if (confirmClear()) navigate(destination);
  }

  async function saveResult(attempt) {
    if (savingRef.current) return;

    savingRef.current = true;
    setSaveStatus('saving');

    try {
      await savePracticeAttempt(attempt);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    } finally {
      savingRef.current = false;
    }
  }

  function checkAnswers(event) {
    event.preventDefault();
    if (result || savingRef.current) return;

    if (answered === 0) {
      setNotice('Answer at least one question before checking.');
      return;
    }

    if (answered < total && !window.confirm('Some questions are unanswered. Check anyway?')) {
      return;
    }

    const attempt = {
      skill: 'reading',
      title: passage.title,
      elapsed_seconds: stopTimer(),
      score: passage.questions.filter(
        (question, i) => normalise(answers[i]) === normalise(question.answer)
      ).length,
      total_questions: total,
    };

    setNotice('');
    setResult(attempt);

    if (questionsRef.current) {
      questionsRef.current.scrollTop = 0;
      questionsRef.current.focus();
    }

    void saveResult(attempt);
  }

  return (
    <div className="rp-page">
      <div className="rp-content rp-practice-content">
        <header className="rp-practice-header">
          <Link
            className="rp-practice-logo"
            to="/dashboard"
            onClick={(event) => leavePage(event, '/dashboard')}
            aria-label="Band Buddy dashboard"
          >
            <img src="/images/logo.png" alt="Band Buddy" />
          </Link>

          <Link
            className="rp-practice-back"
            to="/dashboard"
            onClick={(event) => leavePage(event, '/dashboard')}
          >
            ← Back to dashboard
          </Link>
        </header>

        <main className="rp-main">
          <section className="rp-hero">
            <div>
              <p className="rp-eyebrow">READ. UNDERSTAND. GROW.</p>
              <h1>Reading practice</h1>
              <p>Build your reading skills, one passage at a time.</p>
            </div>
            <img className="rp-hero-image" src="/images/reading-student-v2.png" alt="" />
          </section>

          <nav className="rp-tabs" aria-label="Practice skills">
            <span aria-current="page">Reading</span>
            <button type="button" onClick={() => {
              if (confirmClear()) navigate('/listening');
            }}>
              Listening →
            </button>
          </nav>

          {notice && <p className="rp-notice" role="status">{notice}</p>}

          <div className="rp-toolbar">
            <label className="rp-resource">
              <span>Choose a passage</span>
              <select
                value={index}
                disabled={saveStatus === 'saving'}
                onChange={(event) => clearPractice(Number(event.target.value))}
              >
                {PASSAGES.map((item, i) => (
                  <option key={item.id} value={i}>
                    Practice {i + 1}: {item.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="rp-timer">
              <span aria-label="Elapsed practice time">{formatClock(seconds)}</span>
              <button
                type="button"
                className="rp-button rp-outline"
                onClick={running ? stopTimer : startTimer}
                disabled={Boolean(result)}
              >
                {running ? 'Pause' : seconds > 0 ? 'Resume timer' : 'Start timer'}
              </button>
            </div>
          </div>

          <div className="rp-workspace">
            <section className="rp-panel rp-passage">
              <div className="rp-panel-heading">
                <h2>{passage.title}</h2>
                <div className="rp-font-controls" aria-label="Passage text size">
                  <button
                    type="button"
                    aria-label="Decrease text size"
                    disabled={fontSize <= 16}
                    onClick={() => setFontSize((size) => size - 1)}
                  >
                    A−
                  </button>
                  <button
                    type="button"
                    aria-label="Increase text size"
                    disabled={fontSize >= 24}
                    onClick={() => setFontSize((size) => size + 1)}
                  >
                    A+
                  </button>
                </div>
              </div>

              <div key={passage.id} className="rp-panel-scroll" tabIndex={0} aria-label="Reading passage">
                <p className="rp-sample-note">Original sample passage about a fictional setting.</p>
                <div style={{ fontSize }}>
                  {passage.paragraphs.map((paragraph, i) => (
                    <div className="rp-paragraph" key={i}>
                      <span className="rp-paragraph-label">{String.fromCharCode(65 + i)}</span>
                      <p>{paragraph}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rp-panel">
              <div className="rp-panel-heading">
                <h2>Practice questions</h2>
                <span className="rp-badge">{answered}/{total} answered</span>
              </div>

              <div className="rp-panel-scroll" ref={questionsRef} tabIndex={0} aria-label="Questions and results">
                {result && (
                  <div className="rp-result">
                    <strong>Your result: {result.score}/{total}</strong>
                    <p>Practice time: {formatClock(result.elapsed_seconds)}</p>
                    <p role="status">
                      {saveStatus === 'saving' && 'Saving to practice history…'}
                      {saveStatus === 'saved' && 'Saved to practice history.'}
                      {saveStatus === 'error' && 'Could not save your result.'}
                    </p>
                    {saveStatus === 'error' && (
                      <button type="button" className="rp-button rp-outline" onClick={() => void saveResult(result)}>
                        Retry save
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={checkAnswers}>
                  {passage.questions.map((question, i) => {
                    const correct = normalise(answers[i]) === normalise(question.answer);
                    const type = question.options === TRUE_FALSE
                      ? 'True / False / Not given'
                      : question.options ? 'Multiple choice' : 'One word';

                    return (
                      <fieldset className="rp-question" key={`${passage.id}-${i}`} disabled={Boolean(result)}>
                        <legend>
                          <span className="rp-question-meta">
                            <span>Question {i + 1} of {total}</span>
                            <span>{type}</span>
                          </span>
                          {question.prompt}
                        </legend>

                        {question.options ? (
                          <div className="rp-options">
                            {question.options.map((option) => (
                              <label className="rp-option" key={option}>
                                <input
                                  type="radio"
                                  name={`reading-${i}`}
                                  value={option}
                                  checked={answers[i] === option}
                                  onChange={() => updateAnswer(i, option)}
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input
                            className="rp-input"
                            aria-label={`Answer to question ${i + 1}`}
                            placeholder="Type one word…"
                            autoComplete="off"
                            spellCheck={false}
                            maxLength={100}
                            value={answers[i] || ''}
                            onChange={(event) => updateAnswer(i, event.target.value)}
                          />
                        )}

                        {result && (
                          <div className="rp-explanation">
                            <strong>{correct ? 'Correct' : normalise(answers[i]) ? 'Incorrect' : 'Not answered'}</strong>
                            <p>Correct answer: {question.answer}</p>
                            <p>{question.explanation}</p>
                          </div>
                        )}
                      </fieldset>
                    );
                  })}

                  <div className="rp-actions">
                    <button
                      type="button"
                      className="rp-button rp-outline"
                      onClick={() => clearPractice()}
                      disabled={saveStatus === 'saving'}
                    >
                      {result ? 'Try again' : 'Reset answers'}
                    </button>

                    {!result && (
                      <button type="submit" className="rp-button">Check answers</button>
                    )}
                  </div>
                </form>
              </div>
            </section>
          </div>

          <div className="rp-bottom">
            <span>Passage {index + 1} of {PASSAGES.length}</span>
            <button
              type="button"
              className="rp-button"
              disabled={index === PASSAGES.length - 1 || saveStatus === 'saving'}
              onClick={() => clearPractice(index + 1)}
            >
              Next passage →
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}