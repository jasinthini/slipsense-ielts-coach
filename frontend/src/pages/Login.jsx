import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function Login() {
  const navigate = useNavigate();
  const submittingRef = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    if (submittingRef.current) return;

    const form = event.currentTarget;
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;

    setMessage('');
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      const token = data.access_token;

      if (typeof token !== 'string' || !token) {
        setMessage('Unable to complete login. Please try again.');
        return;
      }

      sessionStorage.setItem('band_buddy_access_token', token);
      form.reset();
      setShowPassword(false);

      navigate(data.user?.role === 'admin' ? '/admin' : '/dashboard', {
        replace: true,
      });
    } catch (error) {
      if (error.response?.status === 401) {
        setMessage('Incorrect email or password.');
      } else if (error.response?.status === 422) {
        setMessage('Please check your email and password.');
      } else {
        setMessage('Unable to complete login. Please try again.');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bl-page bl-login-page">
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
          <section className="bl-form-section" aria-labelledby="login-heading">
            <h1 id="login-heading">Welcome back.</h1>
            <p className="bl-intro">A little practice. A little progress.</p>

            <form onSubmit={handleLogin} aria-busy={isSubmitting}>
              <div className="bl-field">
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your email address"
                  maxLength={254}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="bl-field">
                <label htmlFor="login-password">Password</label>
                <div className="bl-password">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    maxLength={128}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isSubmitting}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="bl-forgot">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setMessage('Password reset is not available yet.')}
                >
                  Forgot password?
                </button>
              </div>

              <button className="bl-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in…' : 'Log in →'}
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
                  'Google sign-in is not available yet. Please use your email and Band Buddy password.'
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
              New to Band Buddy? <Link to="/register">Create an account</Link>
            </p>
          </section>

          <figure className="bl-art-section">
            <img
              className="bl-illustration"
              src="/images/login-student-navy.png"
              alt="Student in a navy blue cardigan holding a laptop"
            />
            <figcaption>Your next step starts here.</figcaption>
          </figure>
        </div>
      </main>
    </div>
  );
}