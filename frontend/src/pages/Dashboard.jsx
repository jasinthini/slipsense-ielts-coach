import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

const TOKEN_KEY = 'band_buddy_access_token';

const skills = [
  {
    key: 'writing',
    title: 'Writing',
    text: 'Practise writing tasks and develop your ideas.',
    route: '/writing',
  },
  {
    key: 'speaking',
    title: 'Speaking',
    text: 'Record your answer and practise expressing your thoughts.',
    route: '/speaking',
  },
  {
    key: 'reading',
    title: 'Reading',
    text: 'Explore passages and build your understanding.',
    route: '/reading',
  },
  {
    key: 'listening',
    title: 'Listening',
    text: 'Listen to a short conversation and practise picking out key details.',
    route: '/listening',
  },
];

const initialGoal = {
  target_band: '7',
  test_type: 'academic',
  exam_date: '',
  daily_minutes: '20',
  focus_skill: 'writing',
};

const iconPaths = {
  home: ['m3 10 9-7 9 7v11h-6v-7H9v7H3Z'],
  writing: ['M13 4H4v17h16v-9', 'm10 14 1-4 8-8 3 3-8 8-4 1Z'],
  speaking: [
    'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0Z',
    'M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8',
  ],
  reading: [
    'M12 6C8 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-6-1-10 2Z',
    'M12 6v15',
  ],
  listening: ['M3 14v-3a9 9 0 0 1 18 0v3', 'M3 12h4v9H3ZM17 12h4v9h-4Z'],
  history: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 7v5l4 2'],
  target: [
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    'M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
    'M12 11v2',
  ],
  settings: [
    'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    'M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  ],
  card: ['M3 5h18v14H3Z', 'M3 10h18M7 15h4'],
  user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z', 'M4 22v-3a8 8 0 0 1 16 0v3'],
  logout: ['M9 3H3v18h6M8 12h13m-5-5 5 5-5 5'],
  gift: [
    'M3 8h18v4H3ZM5 12v9h14v-9M12 8v13',
    'M12 8C4 8 5 1 9 3l3 5Zm0 0c8 0 7-7 3-5Z',
  ],
  arrow: ['M4 12h16m-6-6 6 6-6 6'],
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {(iconPaths[name] || iconPaths.home).map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

function AnalogClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes() + seconds / 60;
  const hours = (time.getHours() % 12) + minutes / 60;

  return (
    <div className="db-clock" role="img" aria-label={`Local time ${time.toLocaleTimeString()}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="57" fill="#FAFCFF" stroke="#91AEC8" strokeWidth="3" />
        {Array.from({ length: 12 }, (_, index) => {
          const number = index + 1;
          const angle = (number * Math.PI) / 6;
          return (
            <text key={number} x={60 + Math.sin(angle) * 44}
              y={63 - Math.cos(angle) * 44} textAnchor="middle"
              fill="#17365A" fontSize="8" fontFamily="Arial, sans-serif">
              {number}
            </text>
          );
        })}
        <line x1="60" y1="60" x2="60" y2="34" stroke="#17365A"
          strokeWidth="4" strokeLinecap="round" transform={`rotate(${hours * 30} 60 60)`} />
        <line x1="60" y1="60" x2="60" y2="23" stroke="#17365A"
          strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${minutes * 6} 60 60)`} />
        <line x1="60" y1="68" x2="60" y2="19" stroke="#619BCD"
          strokeWidth="1" transform={`rotate(${seconds * 6} 60 60)`} />
        <circle cx="60" cy="60" r="3" fill="#17365A" />
      </svg>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  const dialog = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog className="db-dialog" ref={dialog} aria-labelledby="db-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}>
      <div className="db-dialog-heading">
        <h2 id="db-dialog-title">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close">×</button>
      </div>
      {children}
    </dialog>
  );
}

function getError(error, fallback) {
  const detail = error.response?.data?.detail;
  return typeof detail === 'string' ? detail : fallback;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState('');
  const [goal, setGoal] = useState(initialGoal);
  const [name, setName] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [goalMessage, setGoalMessage] = useState('');
  const [goalError, setGoalError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [trialDeadline, setTrialDeadline] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [checks, setChecks] = useState([false, false, false]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem(TOKEN_KEY)) {
      navigate('/login', { replace: true });
      return;
    }

    let active = true;
    const controller = new AbortController();
    setError('');

    api.get('/dashboard/overview', { signal: controller.signal })
      .then(({ data: overview }) => {
        if (!active) return;

        const loadedAt = Date.now();
        setData(overview);
        setName(overview.user.full_name);
        setNow(loadedAt);
        setTrialDeadline(loadedAt + overview.access.remaining_seconds * 1000);

        if (overview.goal) {
          setGoal({
            target_band: String(overview.goal.target_band),
            test_type: overview.goal.test_type,
            exam_date: overview.goal.exam_date || '',
            daily_minutes: String(overview.goal.daily_minutes),
            focus_skill: overview.goal.focus_skill,
          });
        }
      })
      .catch((err) => {
        if (!active) return;

        if (err.response?.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
          navigate('/login', { replace: true });
        } else {
          setError(getError(err, 'Could not load your dashboard. Check the backend and try again.'));
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [navigate, retry]);

  const remainingSeconds = Math.max(0, Math.floor((trialDeadline - now) / 1000));
  const paidActive = Boolean(data?.access.paid_active);
  const daysLeft = Math.ceil(remainingSeconds / 86400);
  const firstName = data?.user.full_name?.trim().split(/\s+/)[0] || 'Learner';
  const initial = firstName.charAt(0).toUpperCase();
  const recentAttempts = data?.recent_attempts || [];
  const drafts = data?.drafts || [];
  const trialText = paidActive
    ? 'Subscription active'
    : daysLeft > 0
      ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left · free trial`
      : 'Free trial ended';

  function showPanel(value) {
    setMenuOpen(false);
    setSettingsError('');
    setPanel(value);
  }

  function openPractice(route) {
    setMenuOpen(false);

    if (!paidActive && Date.now() >= trialDeadline) {
      showPanel('plans');
      return;
    }

    navigate(route);
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    navigate('/login', { replace: true });
  }

  function changeGoal(event) {
    const { name: field, value } = event.target;
    setGoal((current) => ({ ...current, [field]: value }));
  }

  async function saveGoal(event) {
    event.preventDefault();
    if (savingGoal) return;

    setSavingGoal(true);
    setGoalMessage('');
    setGoalError('');

    try {
      const { data: saved } = await api.put('/dashboard/goal', {
        target_band: Number(goal.target_band),
        test_type: goal.test_type,
        exam_date: goal.exam_date || null,
        daily_minutes: Number(goal.daily_minutes),
        focus_skill: goal.focus_skill,
      });
      setData((current) => ({ ...current, goal: saved }));
      setGoalMessage('Your target has been saved.');
    } catch (err) {
      setGoalError(getError(err, 'Could not save your target. Please try again.'));
    } finally {
      setSavingGoal(false);
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    if (savingSettings) return;

    setSavingSettings(true);
    setSettingsError('');

    try {
      const { data: savedUser } = await api.put('/dashboard/settings', {
        full_name: name.trim(),
      });
      setData((current) => ({ ...current, user: savedUser }));
      setName(savedUser.full_name);
      setPanel('');
    } catch (err) {
      setSettingsError(getError(err, 'Could not save your settings.'));
    } finally {
      setSavingSettings(false);
    }
  }

  function jumpToGoal() {
    setMenuOpen(false);
    document.getElementById('dashboard-goal')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    document.getElementById('target-band')?.focus({ preventScroll: true });
  }

  return (
    <div className="db-page">
      <style>{`
        .db-page .db-hero { position: relative; min-height: 380px; isolation: isolate; }
        .db-page .db-hero .db-hero-image {
          position: absolute; top: auto; right: 0; bottom: 0;
          width: 63%; height: 88%; max-width: none;
          object-fit: contain; object-position: right bottom; z-index: 0;
        }
        .db-page .db-hero-copy { position: relative; z-index: 1; }
        .db-page .db-clock { z-index: 2; }
        .db-page .db-saved-panel { overflow: hidden; }
        .db-page .db-saved-drawing {
          display: block; position: static; width: min(300px, 80%); height: 190px;
          margin: 20px 0 0 auto; object-fit: contain; object-position: right bottom;
          border: 0; border-radius: 0; background: transparent; box-shadow: none;
        }
        .db-page .db-bottom-banner {
          display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
          align-items: center; gap: 28px; padding: 32px clamp(20px, 4vw, 56px);
          text-align: left;
        }
        .db-page .db-bottom-drawing {
          display: block; position: static; width: 100%; max-width: 380px;
          height: 240px; margin: 0 auto; object-fit: contain;
          border: 0; border-radius: 0; background: transparent; box-shadow: none;
        }
        @media (max-width: 760px) {
          .db-page .db-hero { min-height: 540px; }
          .db-page .db-hero-copy { width: 100%; max-width: none; padding-bottom: 260px; }
          .db-page .db-hero .db-hero-image {
            width: 100%; height: 250px; object-position: center bottom;
          }
          .db-page .db-clock { width: 72px; height: 72px; top: auto; bottom: 170px; right: 16px; }
          .db-page .db-bottom-banner { grid-template-columns: 1fr; gap: 18px; text-align: center; }
          .db-page .db-bottom-drawing { height: 200px; }
          .db-page .db-saved-drawing { height: 160px; }
        }
      `}</style>

      <a className="db-skip" href="#dashboard-content">Skip to content</a>

      {menuOpen && (
        <button className="db-backdrop" type="button" aria-label="Close navigation"
          onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`db-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <Link to="/dashboard" className="db-logo" aria-label="Band Buddy dashboard">
          <img src="/images/logo.png" alt="Band Buddy" />
        </Link>

        <nav className="db-nav" aria-label="Student navigation">
          <Link className="is-active" to="/dashboard" aria-current="page"
            onClick={() => setMenuOpen(false)}>
            <Icon name="home" /> Dashboard
          </Link>

          {skills.map((skill) => (
            <button key={skill.key} type="button" disabled={!data}
              onClick={() => openPractice(skill.route)}>
              <Icon name={skill.key} />
              <span>{skill.title}</span>
            </button>
          ))}

          <Link to="/writing/history">
            <Icon name="history" /> Practice history
          </Link>
          <button type="button" onClick={jumpToGoal}>
            <Icon name="target" /> Your goal
          </button>
          <button type="button" onClick={() => showPanel('plans')}>
            <Icon name="card" /> Plans &amp; Billing
          </button>
          <button type="button" disabled={!data} onClick={() => showPanel('settings')}>
            <Icon name="settings" /> Settings
          </button>
        </nav>

        <div className="db-sidebar-bottom">
          <button type="button" disabled={!data} onClick={() => showPanel('profile')}>
            <Icon name="user" /> Profile
          </button>
          <button type="button" onClick={logout}>
            <Icon name="logout" /> Log out
          </button>
        </div>
      </aside>

      <div className="db-workspace">
        <header className="db-topbar">
          <button className="db-menu-button" type="button" aria-label="Open navigation"
            aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
            ☰
          </button>

          <Link to="/" className="db-breadcrumb">
            <Icon name="home" /><span>My learning space</span>
          </Link>

          <div className="db-topbar-actions">
            {data && <span className="db-trial"><Icon name="gift" /> {trialText}</span>}
            <button className="db-upgrade" type="button" onClick={() => showPanel('plans')}>
              Upgrade
            </button>
            <button className="db-account" type="button" disabled={!data}
              onClick={() => showPanel('profile')}>
              <span className="db-avatar">{initial}</span>
              <span>{firstName}</span>
            </button>
          </div>
        </header>

        <main className="db-main" id="dashboard-content">
          {error ? (
            <div className="db-loading" role="alert">
              <p>{error}</p>
              <button className="db-button" type="button" onClick={() => setRetry((value) => value + 1)}>
                Try again
              </button>
            </div>
          ) : !data ? (
            <p className="db-loading" role="status">Loading your learning space…</p>
          ) : (
            <>
              <section className="db-welcome">
                <h1>Welcome back, {firstName}.</h1>
                <p>A little practice today. More confidence tomorrow.</p>
                <span className="db-trial-note">
                  {paidActive
                    ? 'Your subscription is active.'
                    : remainingSeconds > 0
                      ? 'Your free trial lasts 72 hours from account creation.'
                      : 'Your trial has ended. Your saved writing is still available.'}
                </span>
              </section>

              <div className="db-hero-row">
                <section className="db-hero">
                  <div className="db-hero-copy">
                    <h2>Make time for<br />your next<br />small step.</h2>
                    <p>Explore a skill and give your ideas a little room to grow.</p>
                  </div>
                  <img src="/images/home-study.png" alt="" className="db-hero-image" />
                  <AnalogClock />
                </section>

                <section className="db-panel db-goal" id="dashboard-goal">
                  <h2><Icon name="target" /> Your IELTS goal</h2>

                  <form onSubmit={saveGoal}>
                    <label htmlFor="target-band">Target band</label>
                    <select id="target-band" name="target_band" value={goal.target_band}
                      onChange={changeGoal} disabled={savingGoal}>
                      {Array.from({ length: 17 }, (_, i) => 1 + i * 0.5).map((band) => (
                        <option key={band} value={band}>{band.toFixed(1)}</option>
                      ))}
                    </select>

                    <label htmlFor="test-type">Test type</label>
                    <select id="test-type" name="test_type" value={goal.test_type}
                      onChange={changeGoal} disabled={savingGoal}>
                      <option value="academic">Academic</option>
                      <option value="general">General Training</option>
                    </select>

                    <label htmlFor="exam-date">Exam date</label>
                    <input id="exam-date" name="exam_date" type="date" value={goal.exam_date}
                      onChange={changeGoal} disabled={savingGoal} />

                    <label htmlFor="daily-minutes">Daily practice</label>
                    <select id="daily-minutes" name="daily_minutes" value={goal.daily_minutes}
                      onChange={changeGoal} disabled={savingGoal}>
                      {[10, 15, 20, 30, 45, 60].map((minutes) => (
                        <option key={minutes} value={minutes}>{minutes} minutes</option>
                      ))}
                    </select>

                    <label htmlFor="focus-skill">Focus skill</label>
                    <select id="focus-skill" name="focus_skill" value={goal.focus_skill}
                      onChange={changeGoal} disabled={savingGoal}>
                      {skills.map((skill) => (
                        <option key={skill.key} value={skill.key}>{skill.title}</option>
                      ))}
                    </select>

                    <button className="db-button db-goal-save" type="submit" disabled={savingGoal}>
                      {savingGoal ? 'Saving…' : data.goal ? 'Update target' : 'Save target'}
                    </button>
                  </form>

                  {goalMessage && <p className="db-form-message" role="status">{goalMessage}</p>}
                  {goalError && <p className="db-form-error" role="alert">{goalError}</p>}
                  <p className="db-help">Your goal is personal. You can edit it anytime.</p>
                </section>
              </div>

              <section className="db-section">
                <h2>Choose your practice</h2>
                <div className="db-skills">
                  {skills.map((skill) => (
                    <article className="db-panel db-skill" key={skill.key}>
                      <span className={`db-skill-art db-art-${skill.key}`} aria-hidden="true" />
                      <h3>{skill.title}</h3>
                      <p>{skill.text}</p>
                      <button className="db-button" type="button"
                        onClick={() => openPractice(skill.route)}>
                        Start practice <Icon name="arrow" />
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <div className="db-content-row">
                <section className="db-panel">
                  <div className="db-panel-heading">
                    <h2>Recent writing</h2>
                    <Link to="/writing/history">View all →</Link>
                  </div>

                  {recentAttempts.length > 0 ? (
                    <div className="db-table-scroll">
                      <table>
                        <caption className="db-sr-only">Your latest writing attempts</caption>
                        <thead>
                          <tr><th>Question</th><th>Status</th><th>Saved</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {recentAttempts.map((attempt) => (
                            <tr key={attempt.id}>
                              <td>{attempt.title}</td>
                              <td>
                                <span className="db-status">
                                  {attempt.status === 'draft' ? 'Draft' : 'Submitted'}
                                </span>
                              </td>
                              <td>{formatDate(attempt.updated_at)}</td>
                              <td>
                                <Link to="/writing/history" className="db-table-link">
                                  {attempt.status === 'draft' ? 'Continue' : 'Review'} →
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="db-empty">
                      <Icon name="writing" />
                      <p>Your saved writing will appear here.</p>
                      <button className="db-button" type="button" onClick={() => openPractice('/writing')}>
                        Explore writing
                      </button>
                    </div>
                  )}
                </section>

                <section className="db-panel db-checklist">
                  <h2>Your next session</h2>
                  {[
                    'Plan your ideas before you start.',
                    'Take your time to organise a clear answer.',
                    'Review your writing before submitting.',
                  ].map((text, index) => (
                    <label key={text}>
                      <input type="checkbox" checked={checks[index]}
                        onChange={() => setChecks((current) =>
                          current.map((value, item) => item === index ? !value : value)
                        )} />
                      <span>{text}</span>
                    </label>
                  ))}
                  <Link to="/writing/history">View writing history →</Link>
                </section>
              </div>

              <div className="db-content-row">
                <section className="db-panel db-saved-panel">
                  <h2>Your saved writing</h2>
                  {drafts.length > 0 ? drafts.map((draft) => (
                    <article className="db-draft" key={draft.id}>
                      <span className="db-draft-icon"><Icon name="writing" /></span>
                      <div>
                        <h3>{draft.title}</h3>
                        <p>{draft.word_count} words · {formatDate(draft.updated_at)}</p>
                      </div>
                      <Link className="db-button" to="/writing/history">Open draft →</Link>
                    </article>
                  )) : (
                    <p className="db-muted">
                      No drafts yet. Save an answer during writing practice to find it here.
                    </p>
                  )}
                  <p className="db-help">Open writing history to select and continue your saved answer.</p>
                  <img className="db-saved-drawing" src="/images/saved-writing.png" alt="" loading="lazy" />
                </section>

                <section className="db-panel db-tip">
                  <h2>Writing tip</h2>
                  <h3>One main idea per paragraph.</h3>
                  <p>Explain your point and support it with a clear reason or example.</p>
                  <span className="db-skill-art db-art-writing" aria-hidden="true" />
                </section>
              </div>

              <section className="db-bottom-banner">
                <img className="db-bottom-drawing" src="/images/home-study.png" alt="" loading="lazy" />
                <div>
                  <h2>Keep going, one session<br />at a time.</h2>
                  <p>Choose a practice and build your skills steadily.</p>
                  <button className="db-button" type="button" onClick={() => openPractice('/writing')}>
                    Open practice <Icon name="arrow" />
                  </button>
                </div>
              </section>

              <footer className="db-footer">Band Buddy · Small steps. Meaningful progress.</footer>
            </>
          )}
        </main>
      </div>

      {panel === 'plans' && (
        <Modal title="Plans & Billing" onClose={() => setPanel('')}>
          {data && <p className="db-muted">{trialText}</p>}
          <p className="db-muted">Free trial: 3 days, 3 AI reviews total. No card required.</p>
          <div className="db-plan-grid">
            <article>
              <h3>Plus</h3>
              <strong>LKR 499 <small>/ month</small></strong>
              <p>20 AI reviews per month across Writing and Speaking.</p>
            </article>
            <article>
              <h3>Pro</h3>
              <strong>LKR 999 <small>/ month</small></strong>
              <p>50 AI reviews per month across Writing and Speaking.</p>
            </article>
          </div>
          <div className="db-info">Online checkout and review allowances are not active yet.</div>
          <button className="db-button" type="button" onClick={() => setPanel('')}>
            Back to dashboard
          </button>
        </Modal>
      )}

      {panel === 'settings' && data && (
        <Modal title="Settings" onClose={() => setPanel('')}>
          <form className="db-settings-form" onSubmit={saveSettings}>
            <label htmlFor="settings-name">Full name</label>
            <input id="settings-name" value={name} minLength={2} maxLength={100}
              required disabled={savingSettings} onChange={(event) => setName(event.target.value)} />
            <p className="db-help">This updates the name on your account.</p>
            {settingsError && <p className="db-form-error" role="alert">{settingsError}</p>}
            <button className="db-button" type="submit" disabled={savingSettings}>
              {savingSettings ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </Modal>
      )}

      {panel === 'profile' && data && (
        <Modal title="My profile" onClose={() => setPanel('')}>
          <span className="db-avatar">{initial}</span>
          <h3>{data.user.full_name}</h3>
          <p className="db-profile-email">{data.user.email}</p>
          <button className="db-button" type="button" onClick={() => showPanel('settings')}>
            Edit name
          </button>
        </Modal>
      )}
    </div>
  );
}