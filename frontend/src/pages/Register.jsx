import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.05a10 10 0 0 0 0 9.02l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.79.5 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.35 2.59C7.19 7.72 9.4 5.96 12 5.96Z"
      />
    </svg>
  );
}

function PasswordField({ id, name, label, placeholder, disabled, help }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="bl-field">
      <label htmlFor={id}>{label}</label>

      <div className="bl-password">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder={placeholder}
          minLength={12}
          maxLength={128}
          aria-describedby={help ? `${id}-help` : undefined}
          disabled={disabled}
          required
        />
        <button
          type="button"
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          disabled={disabled}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>

      {help && (
        <small id={`${id}-help`} className="bl-register-help">
          {help}
        </small>
      )}
    </div>
  );
}

export default function Register() {
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordFieldsKey, setPasswordFieldsKey] = useState(0);

  async function handleRegister(event) {
    event.preventDefault();
    if (submittingRef.current) return;

    setMessage('');

    const form = event.currentTarget;
    const fullName = form.elements.fullName.value.trim();
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const confirmPassword = form.elements.confirmPassword.value;

    if (!fullName) {
      setMessage('Please enter your full name.');
      return;
    }

    if (password.length < 12) {
      setMessage('Please use a password with at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match. Please check both passwords.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await api.post('/auth/register', {
        full_name: fullName,
        email,
        password,
      });

      form.reset();
      setPasswordFieldsKey((value) => value + 1);
      setMessage('Account created successfully! Click Log in to continue.');
    } catch (error) {
      const detail = error.response?.data?.detail;

      if (typeof detail === 'string') {
        setMessage(detail);
      } else if (Array.isArray(detail)) {
        setMessage('Please check your name, email and password.');
      } else if (!error.response) {
        setMessage(
          'Could not confirm registration. Check your connection. If the email is already registered, try logging in.'
        );
      } else {
        setMessage('Unable to create your account. Please try again later.');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bl-page bl-login-page bl-register-page">
      <header className="bl-header">
        <Link to="/" aria-label="Band Buddy home">
          <img className="bl-logo" src="/images/logo.png" alt="Band Buddy" />
        </Link>

        <Link className="bl-back" to="/">
          ← Back to home
        </Link>
      </header>

      <main className="bl-main">
        <div className="bl-layout">
          <section className="bl-form-section" aria-labelledby="register-heading">
            <h1 id="register-heading">Make room for progress.</h1>
            <p className="bl-intro">Create your Band Buddy account.</p>

            <form onSubmit={handleRegister} aria-busy={isSubmitting}>
              <div className="bl-field">
                <label htmlFor="register-name">Full name</label>
                <input
                  id="register-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  maxLength={100}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="bl-field">
                <label htmlFor="register-email">Email address</label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  maxLength={254}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <PasswordField
                key={`password-${passwordFieldsKey}`}
                id="register-password"
                name="password"
                label="Password"
                placeholder="Create a password"
                help="Use at least 12 characters."
                disabled={isSubmitting}
              />

              <PasswordField
                key={`confirm-${passwordFieldsKey}`}
                id="register-confirm-password"
                name="confirmPassword"
                label="Confirm password"
                placeholder="Confirm your password"
                disabled={isSubmitting}
              />

              <button className="bl-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account…' : 'Create account →'}
              </button>
            </form>

            <div className="bl-divider">
              <span>or</span>
            </div>

            <button
              className="bl-google"
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                setMessage(
                  'Google sign-in is not available yet. Please register using your email.'
                )
              }
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {message && (
              <p className="bl-message" role="status">
                {message}
              </p>
            )}

            <p className="bl-register">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </section>

          <figure className="bl-art-section">
            <img
              className="bl-illustration"
              src="/images/register-study.png"
              alt="IELTS study illustration"
            />
            <figcaption>Small steps. Meaningful progress.</figcaption>
          </figure>
        </div>
      </main>
    </div>
  );
}