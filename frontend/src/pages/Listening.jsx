import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { savePracticeAttempt } from '../services/practiceHistory';
import './Reading.css';

const TITLE = 'Booking a workshop';

const DIALOGUE = [
  ['Maya', 'Hello, I’d like to join the photography workshop. Is it still on Saturday morning?'],
  ['Daniel', 'We moved it to Sunday. It starts at ten thirty in the morning.'],
  ['Maya', 'Is it in the main hall?'],
  ['Daniel', 'No, please go to Room Four on the first floor.'],
  ['Maya', 'How much does it cost, and what should I bring?'],
  ['Daniel', 'It costs twelve pounds. Bring a notebook. You can borrow a camera here.'],
];

const QUESTIONS = [
  {
    prompt: 'Which day is the workshop?',
    options: ['Friday', 'Saturday', 'Sunday'],
    answer: 'Sunday',
    explanation: 'Daniel says the workshop was moved to Sunday.',
  },
  {
    prompt: 'What time does the workshop start?',
    options: ['9:30 a.m.', '10:30 a.m.', '11:30 a.m.'],
    answer: '10:30 a.m.',
    explanation: 'Daniel says it starts at ten thirty in the morning.',
  },
  {
    prompt: 'Where should Maya go?',
    options: ['Room Two', 'Room Four', 'The main hall'],
    answer: 'Room Four',
    explanation: 'Daniel directs Maya to Room Four on the first floor.',
  },
  {
    prompt: 'How much does the workshop cost?',
    options: ['£10', '£12', '£20'],
    answer: '£12',
    explanation: 'Daniel says it costs twelve pounds.',
  },
  {
    prompt: 'What should Maya bring?',
    options: ['A camera', 'A laptop', 'A notebook'],
    answer: 'A notebook',
    explanation: 'She should bring a notebook. She can borrow a camera there.',
  },
];

export default function Listening() {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');

  const startedAtRef = useRef(null);
  const playbackRef = useRef(null);
  const questionsRef = useRef(null);
  const savingRef = useRef(false);

  const synth = window.speechSynthesis;
  const canPlay = Boolean(synth && window.SpeechSynthesisUtterance);
  const answered = Object.keys(answers).length;

  useEffect(() => {
    return () => {
      if (playbackRef.current) {
        playbackRef.current = null;
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  function startPractice() {
    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }
  }

  function stopConversation() {
    if (playbackRef.current) {
      playbackRef.current = null;
      synth.cancel();
    }
    setPlaying(false);
  }

  function playConversation() {
    if (!canPlay || playbackRef.current) return;
    if (!result) startPractice();

    const voices = synth.getVoices().filter((voice) => /^en\b/i.test(voice.lang));

    const lines = DIALOGUE.map(([speaker, text]) => {
      const speech = new window.SpeechSynthesisUtterance(text);
      const voice = voices[speaker === 'Maya' ? 0 : 1] || voices[0];

      speech.lang = voice?.lang || 'en-GB';
      if (voice) speech.voice = voice;
      speech.rate = 0.9;
      speech.pitch = speaker === 'Maya' ? 1.12 : 0.9;
      return speech;
    });

    playbackRef.current = lines;
    setMessage('');
    setPlaying(true);

    lines.forEach((speech, index) => {
      speech.onend = () => {
        if (playbackRef.current === lines && index === lines.length - 1) {
          playbackRef.current = null;
          setPlaying(false);
        }
      };

      speech.onerror = () => {
        if (playbackRef.current !== lines) return;
        stopConversation();
        setMessage('Audio could not play. Check your browser’s English voice and try again.');
      };
    });

    lines.forEach((speech) => synth.speak(speech));
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

    if (answered < QUESTIONS.length) {
      setMessage('Answer all five questions before checking.');
      return;
    }

    const attempt = {
      skill: 'listening',
      title: TITLE,
      elapsed_seconds: Math.floor((Date.now() - (startedAtRef.current ?? Date.now())) / 1000),
      score: QUESTIONS.filter((question, i) => answers[i] === question.answer).length,
      total_questions: QUESTIONS.length,
    };

    stopConversation();
    setMessage('');
    setResult(attempt);

    if (questionsRef.current) {
      questionsRef.current.scrollTop = 0;
      questionsRef.current.focus();
    }

    void saveResult(attempt);
  }

  function resetPractice() {
    if (savingRef.current) return;
    if (saveStatus === 'error' && !window.confirm('This result was not saved. Start again anyway?')) {
      return;
    }

    stopConversation();
    startedAtRef.current = null;
    setAnswers({});
    setResult(null);
    setMessage('');
    setSaveStatus('idle');

    if (questionsRef.current) questionsRef.current.scrollTop = 0;
  }

  return (
    <div className="rp-page">
      <div className="rp-content rp-practice-content">
        <header className="rp-practice-header">
          <Link className="rp-practice-logo" to="/dashboard" aria-label="Band Buddy dashboard">
            <img src="/images/logo.png" alt="Band Buddy" />
          </Link>
          <Link className="rp-practice-back" to="/dashboard">
            ← Back to dashboard
          </Link>
        </header>

        <main className="rp-main">
          <section className="rp-hero" aria-labelledby="listening-title">
            <div>
              <p className="rp-eyebrow">LISTEN. UNDERSTAND. GROW.</p>
              <h1 id="listening-title">Listening practice</h1>
              <p>Listen to a conversation and pick out the key details.</p>
            </div>
            <img className="rp-hero-image" src="/images/listening-hero.png" alt="" />
          </section>

          <nav className="rp-tabs" aria-label="Practice skills">
            <Link className="rp-button rp-outline" to="/reading">← Reading</Link>
            <span aria-current="page">Listening</span>
          </nav>

          {message && <p className="rp-notice" role="status">{message}</p>}

          <div className="rp-workspace">
            <section className="rp-panel" aria-labelledby="audio-title">
              <div className="rp-panel-heading">
                <h2 id="audio-title">{TITLE}</h2>
                <span className="rp-badge">Practice 1</span>
              </div>

              <div className="rp-panel-scroll" tabIndex={0} aria-label="Conversation and transcript">
                <p>Maya is asking Daniel about a photography workshop.</p>
                <p>Read the questions first, then play the conversation.</p>

                <button
                  type="button"
                  className="rp-button"
                  disabled={!canPlay}
                  onClick={playing ? stopConversation : playConversation}
                >
                  {playing ? '■ Stop audio' : '▶ Play conversation'}
                </button>

                <p className="rp-help" role="status">
                  {!canPlay
                    ? 'This browser does not support text-to-speech.'
                    : playing
                      ? 'Playing conversation…'
                      : 'Practice audio uses your browser’s English voice.'}
                </p>

                {result && (
                  <details>
                    <summary>Read the transcript</summary>
                    {DIALOGUE.map(([speaker, line], i) => (
                      <p key={i}><strong>{speaker}:</strong> {line}</p>
                    ))}
                  </details>
                )}
              </div>
            </section>

            <section className="rp-panel" aria-labelledby="listening-questions">
              <div className="rp-panel-heading">
                <h2 id="listening-questions">Practice questions</h2>
                <span className="rp-badge">{answered}/{QUESTIONS.length} answered</span>
              </div>

              <div
                className="rp-panel-scroll"
                ref={questionsRef}
                tabIndex={0}
                aria-label="Questions and results"
              >
                {result && (
                  <div className="rp-result">
                    <strong>Your result: {result.score}/{result.total_questions}</strong>
                    <p role="status">
                      {saveStatus === 'saving' && 'Saving to practice history…'}
                      {saveStatus === 'saved' && 'Saved to practice history.'}
                      {saveStatus === 'error' && 'Could not save your result. Please try again.'}
                    </p>

                    {saveStatus === 'error' && (
                      <button
                        type="button"
                        className="rp-button rp-outline"
                        onClick={() => void saveResult(result)}
                      >
                        Retry save
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={checkAnswers}>
                  {QUESTIONS.map((question, i) => (
                    <fieldset className="rp-question" key={question.prompt} disabled={Boolean(result)}>
                      <legend>{i + 1}. {question.prompt}</legend>

                      <div className="rp-options">
                        {question.options.map((option) => (
                          <label className="rp-option" key={option}>
                            <input
                              type="radio"
                              name={`listening-${i}`}
                              value={option}
                              checked={answers[i] === option}
                              onChange={() => {
                                startPractice();
                                setAnswers((current) => ({ ...current, [i]: option }));
                                setMessage('');
                              }}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>

                      {result && (
                        <div className="rp-explanation">
                          <strong>{answers[i] === question.answer ? 'Correct' : 'Incorrect'}</strong>
                          <p>Correct answer: {question.answer}</p>
                          <p>{question.explanation}</p>
                        </div>
                      )}
                    </fieldset>
                  ))}

                  <div className="rp-actions">
                    <button
                      type="button"
                      className="rp-button rp-outline"
                      onClick={resetPractice}
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
        </main>
      </div>
    </div>
  );
}