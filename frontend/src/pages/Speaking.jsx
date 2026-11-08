import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import SpeakingPracticeSave from '../components/SpeakingPracticeSave';
import './Speaking.css';

const TOKEN_KEY = 'band_buddy_access_token';
const COACH_IMAGE = '/images/login-student.png';
const WAVE_HEIGHTS = [14, 22, 34, 48, 27, 60, 44, 25, 37, 52, 30, 20, 35, 48, 26, 17];

const PARTS = {
  part1: {
    label: 'Part 1',
    title: 'Familiar topics',
    tip: 'Answer naturally. Add a reason or a short example.',
    topics: [
      {
        title: 'Your hometown',
        prompt: 'What do you like most about the place where you live?',
        points: [
          'Has your hometown changed in recent years?',
          'Would you like to live there in the future?',
        ],
      },
      {
        title: 'Your daily routine',
        prompt: 'Talk about your usual daily activities.',
        points: [
          'What do you usually do in the morning?',
          'What is your favourite time of day?',
          'Would you like to change your routine?',
        ],
      },
      {
        title: 'Learning English',
        prompt: 'Talk about your experience of learning English.',
        points: [
          'When did you start learning English?',
          'What do you enjoy about learning it?',
          'How do you practise outside class?',
        ],
      },
    ],
  },
  part2: {
    label: 'Part 2',
    title: 'Long turn',
    tip: 'Take a little time to plan. Try speaking for one to two minutes.',
    topics: [
      {
        title: 'A place you enjoy visiting',
        prompt: 'Describe a place you enjoy visiting in your free time.',
        points: [
          'Where the place is.',
          'When you usually go there.',
          'What you do there.',
          'Explain why you enjoy visiting this place.',
        ],
      },
      {
        title: 'A skill you would like to learn',
        prompt: 'Describe a skill you would like to learn in the future.',
        points: [
          'What the skill is.',
          'Why you want to learn it.',
          'How you would learn it.',
          'Explain how this skill could help you.',
        ],
      },
      {
        title: 'Someone who helped you',
        prompt: 'Describe a person who helped you during a difficult time.',
        points: [
          'Who the person is.',
          'What the situation was.',
          'How the person helped you.',
          'Explain how you felt afterwards.',
        ],
      },
    ],
  },
  part3: {
    label: 'Part 3',
    title: 'Discussion',
    tip: 'Explain your views and support them with reasons or examples.',
    topics: [
      {
        title: 'Technology and learning',
        prompt: 'Discuss how technology affects the way people learn.',
        points: [
          'How has technology changed education?',
          'What are the limits of learning online?',
          'Will teachers remain important in the future?',
        ],
      },
      {
        title: 'Cities and communities',
        prompt: 'Discuss life in cities and local communities.',
        points: [
          'Why do many people move to cities?',
          'How can cities become better places to live?',
          'What helps people feel part of a community?',
        ],
      },
      {
        title: 'Work and personal time',
        prompt: 'Discuss the relationship between work and personal life.',
        points: [
          'Why do some people work very long hours?',
          'How can employers support a better work-life balance?',
          'Will working patterns change in the future?',
        ],
      },
    ],
  },
};

function formatClock(seconds) {
  return [Math.floor(seconds / 60), seconds % 60]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

function getExtension(type) {
  if (type.includes('mp4')) return 'm4a';
  if (type.includes('ogg')) return 'ogg';
  return 'webm';
}

function releaseRecording(session) {
  if (!session) return;

  window.clearInterval(session.timer);

  const recorder = session.recorder;
  if (recorder) {
    recorder.ondataavailable = null;
    recorder.onstop = null;
    recorder.onerror = null;

    if (recorder.state !== 'inactive') recorder.stop();
  }

  session.stream?.getTracks().forEach((track) => track.stop());
}

function MicIcon({ recording }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {recording ? (
        <rect x="6" y="6" width="12" height="12" rx="2" />
      ) : (
        <>
          <rect x="9" y="2" width="6" height="13" rx="3" />
          <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
        </>
      )}
    </svg>
  );
}

export default function Speaking() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [retry, setRetry] = useState(0);
  const [part, setPart] = useState('part1');
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState(null);
  const [error, setError] = useState('');

  const sessionRef = useRef(null);
  const clipUrlRef = useRef('');
  const headingRef = useRef(null);
  const focusTopicRef = useRef(false);

  const current = PARTS[part];
  const topic = current.topics[index];
  const recording = phase === 'recording';
  const locked = phase !== 'idle';

  useEffect(() => {
    if (!sessionStorage.getItem(TOKEN_KEY)) {
      navigate('/login', { replace: true });
      return;
    }

    let active = true;

    async function checkLogin() {
      try {
        await api.get('/auth/me');
        if (active) setReady(true);
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
          navigate('/login', { replace: true });
        } else {
          setAuthError('Could not open speaking practice. Please try again.');
        }
      }
    }

    checkLogin();

    return () => {
      active = false;
    };
  }, [navigate, retry]);

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      sessionRef.current = null;
      releaseRecording(session);

      if (clipUrlRef.current) {
        URL.revokeObjectURL(clipUrlRef.current);
        clipUrlRef.current = '';
      }
    };
  }, []);

  useEffect(() => {
    if (!locked && !clip) return;

    function warnBeforeLeaving(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [locked, clip]);

  useEffect(() => {
    if (!focusTopicRef.current) return;
    focusTopicRef.current = false;
    headingRef.current?.focus();
  }, [part, index]);

  function clearClip() {
    if (clipUrlRef.current) {
      URL.revokeObjectURL(clipUrlRef.current);
      clipUrlRef.current = '';
    }

    setClip(null);
    setSeconds(0);
    setError('');
  }

  function confirmDiscard() {
    return (
      !clipUrlRef.current ||
      window.confirm(
        'Download your recording if you want to keep it. Continue and discard this recording?'
      )
    );
  }

  function selectPart(key) {
    if (key === part || sessionRef.current || !confirmDiscard()) return;

    clearClip();
    focusTopicRef.current = true;
    setPart(key);
    setIndex(0);
  }

  function moveTopic(nextIndex) {
    if (
      nextIndex < 0 ||
      nextIndex >= current.topics.length ||
      sessionRef.current ||
      !confirmDiscard()
    ) return;

    clearClip();
    focusTopicRef.current = true;
    setIndex(nextIndex);
  }

  function leaveDashboard(event) {
    event.preventDefault();

    if (sessionRef.current) {
      setError('Wait for microphone access or stop recording before leaving.');
      return;
    }

    if (confirmDiscard()) navigate('/dashboard');
  }

  async function startRecording() {
    if (sessionRef.current || !confirmDiscard()) return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Microphone recording requires a supported browser on localhost or HTTPS.');
      return;
    }

    const session = {
      recorder: null,
      stream: null,
      timer: null,
      startedAt: 0,
      stoppedAt: null,
    };

    sessionRef.current = session;
    setError('');
    setPhase('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (sessionRef.current !== session) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      session.stream = stream;

      const preferredType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ].find((type) => MediaRecorder.isTypeSupported?.(type));

      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);

      session.recorder = recorder;
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onerror = () => {
        if (sessionRef.current !== session) return;

        sessionRef.current = null;
        releaseRecording(session);
        setPhase('idle');
        setError('Recording failed. Please try again.');
      };

      recorder.onstop = () => {
        if (sessionRef.current !== session) return;

        const finishedAt = session.stoppedAt ?? Date.now();
        const duration = Math.max(0, Math.floor((finishedAt - session.startedAt) / 1000));

        sessionRef.current = null;
        releaseRecording(session);
        setPhase('idle');
        setSeconds(duration);

        const type = recorder.mimeType || chunks[0]?.type || 'audio/webm';
        const blob = new Blob(chunks, { type });

        if (!blob.size) {
          setError('No audio was captured. Please try again.');
          return;
        }

        const url = URL.createObjectURL(blob);
        clipUrlRef.current = url;
        setClip({
          url,
          extension: getExtension(type),
          title: topic.title,
          seconds: duration,
        });
      };

      recorder.start();
      session.startedAt = Date.now();
      clearClip();
      setPhase('recording');

      session.timer = window.setInterval(() => {
        setSeconds(Math.floor((Date.now() - session.startedAt) / 1000));
      }, 250);
    } catch (err) {
      if (sessionRef.current !== session) return;

      sessionRef.current = null;
      releaseRecording(session);
      setPhase('idle');

      if (err.name === 'NotAllowedError') {
        setError('Microphone access was blocked. Allow it in your browser and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone was found. Connect one and try again.');
      } else {
        setError('Could not start recording. Check your microphone and try again.');
      }
    }
  }

  function stopRecording() {
    const session = sessionRef.current;
    if (!session?.recorder || session.recorder.state === 'inactive') return;

    session.stoppedAt = Date.now();
    window.clearInterval(session.timer);
    setPhase('stopping');
    session.recorder.stop();
  }

  if (!ready) {
    return (
      <main className="sp-page sp-loading">
        <h1>Speaking practice</h1>

        {authError ? (
          <>
            <p role="alert">{authError}</p>
            <button
              type="button"
              className="sp-button"
              onClick={() => {
                setAuthError('');
                setRetry((value) => value + 1);
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <p role="status">Opening your practice space…</p>
        )}
      </main>
    );
  }

  const status = phase === 'requesting'
    ? 'Allow microphone access in your browser.'
    : recording
      ? 'Recording… Press Stop recording when you finish.'
      : phase === 'stopping'
        ? 'Preparing playback…'
        : clip
          ? 'Your recording is ready. Listen below or save this practice.'
          : 'Tap the microphone when you are ready to speak.';

  return (
    <div className="sp-page">
      <header className="sp-header">
        <div className="sp-shell sp-navigation">
          <Link to="/dashboard" aria-label="Band Buddy dashboard" onClick={leaveDashboard}>
            <img src="/images/logo.png" alt="Band Buddy" />
          </Link>

          <Link to="/dashboard" onClick={leaveDashboard}>
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="sp-shell sp-main sp-studio">
        <section className="sp-studio-hero" aria-labelledby="speaking-title">
          <div>
            <p className="sp-eyebrow">BAND BUDDY · IELTS PRACTICE</p>
            <h1 id="speaking-title">Speaking practice</h1>
            <p>Build confidence, one answer at a time.</p>
          </div>
          <img src="/images/speaking-conversation.png" alt="" />
        </section>

        <div className="sp-part-switch" role="group" aria-label="Speaking part">
          {Object.entries(PARTS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              aria-pressed={part === key}
              disabled={locked}
              onClick={() => selectPart(key)}
            >
              <strong>{item.label}</strong>
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        <div className="sp-studio-grid">
          <section className="sp-studio-panel" aria-labelledby="sp-topic-title">
            <div className="sp-coach-note">
              <img src={COACH_IMAGE} alt="" />
              <div>
                <p className="sp-eyebrow">YOUR SPEAKING PROMPT</p>
                <h2 id="sp-topic-title" ref={headingRef} tabIndex={-1}>
                  {topic.title}
                </h2>
                <p>{current.tip}</p>
              </div>
            </div>

            <div className="sp-prompt-box">
              <p className="sp-topic-number">
                Topic {index + 1} of {current.topics.length}
              </p>
              <h3>{topic.prompt}</h3>
              <ul className="sp-points">
                {topic.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </div>

            <div className="sp-record-box">
              <div className="sp-record-row">
                <button
                  type="button"
                  className="sp-mic-control"
                  disabled={locked && !recording}
                  onClick={recording ? stopRecording : startRecording}
                  aria-label={
                    recording ? 'Stop recording' : clip ? 'Record again' : 'Start recording'
                  }
                >
                  <MicIcon recording={recording} />
                </button>

                <div
                  className={`sp-wave${recording ? ' sp-wave-live' : ''}`}
                  aria-hidden="true"
                >
                  {WAVE_HEIGHTS.map((height, bar) => (
                    <span
                      key={bar}
                      style={{
                        height: `${height}%`,
                        animationDelay: `${bar * 45}ms`,
                      }}
                    />
                  ))}
                </div>

                <span className="sp-studio-clock" aria-label={`Recording time: ${formatClock(seconds)}`}>
                  {formatClock(seconds)}
                </span>
              </div>

              <p className="sp-record-status" role="status">{status}</p>

              <div className="sp-studio-actions">
                {recording ? (
                  <button type="button" className="sp-button" onClick={stopRecording}>
                    Stop recording
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sp-button"
                    disabled={locked}
                    onClick={startRecording}
                  >
                    {phase === 'requesting' ? 'Opening microphone…'
                      : phase === 'stopping' ? 'Finishing recording…'
                        : clip ? 'Record again' : 'Start recording'}
                  </button>
                )}
              </div>

              {error && <p className="sp-error" role="alert">{error}</p>}

              {clip && (
                <div className="sp-playback">
                  <audio
                    key={clip.url}
                    controls
                    preload="metadata"
                    src={clip.url}
                    aria-label="Listen to your recorded answer"
                  />

                  <SpeakingPracticeSave
                    key={`save-${clip.url}`}
                    title={clip.title}
                    seconds={clip.seconds}
                  />

                  <a
                    className="sp-button sp-outline"
                    href={clip.url}
                    download={`band-buddy-${part}-topic-${index + 1}.${clip.extension}`}
                  >
                    Download recording
                  </a>
                </div>
              )}
            </div>

            <div className="sp-studio-actions">
              <button
                type="button"
                className="sp-button sp-outline"
                disabled={locked || index === 0}
                onClick={() => moveTopic(index - 1)}
              >
                ← Previous topic
              </button>

              <button
                type="button"
                className="sp-button"
                disabled={locked || index === current.topics.length - 1}
                onClick={() => moveTopic(index + 1)}
              >
                Next topic →
              </button>
            </div>
          </section>

          <aside className="sp-studio-panel sp-transcript" aria-labelledby="sp-transcript-title">
            <div className="sp-transcript-heading">
              <h2 id="sp-transcript-title">Transcript</h2>
              <span>Coming soon</span>
            </div>

            <p>Automatic transcripts are not available yet. You can record your answer and listen back in the recording panel.</p>

            <button type="button" className="sp-button" disabled>
              Submit for feedback
            </button>
          </aside>
        </div>
      </main>

      <footer className="sp-footer">
        Band Buddy · Small steps. Meaningful progress.
      </footer>
    </div>
  );
}