import { useState } from 'react';
import '../App.css';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  function handleLogin(event) {
    event.preventDefault();
    setMessage('Sign-in is not available yet. Please try again later.');
  }

  return (
    <div className="bb-page bb-login-page">
      <header className="bb-header">
        <nav className="bb-shell bb-navigation" aria-label="Main navigation">
          <a className="bb-brand" href="/" aria-label="Band Buddy home">
            <img src="/images/logo.png" alt="Band Buddy" />
          </a>

          <a className="bb-login" href="/">
            ← Back to home
          </a>
        </nav>
      </header>

      <main className="container bb-login-main">
        <div
          className="row g-0 overflow-hidden mx-auto"
          style={{
            maxWidth: '1100px',
            borderRadius: '24px',
            background: '#ffffff',
            boxShadow: '0 16px 50px #102b5010',
          }}
        >
          <div
            className="col-lg-6 d-flex flex-column justify-content-center p-4 p-md-5"
            style={{ background: '#dceeff' }}
          >
            <img
              src="/images/login-study.png"
              alt="Student practising IELTS on her laptop"
              className="w-100 mb-4"
              style={{
              borderRadius: '16px',
              height: 'auto',
              display: 'block',
}}
            />

            <h2
              className="fw-bold"
              style={{ color: '#102b50', fontSize: '30px' }}
            >
              Better English.
              <br />
              <span style={{ color: '#0866ed' }}>
                Brighter opportunities.
              </span>
            </h2>

            <p className="mb-0 mt-2" style={{ color: '#526c8f' }}>
              Practise at your own pace and learn from every answer.
            </p>
          </div>

          <div className="col-lg-6 p-4 p-md-5">
            <h1
              className="fw-bold mb-2"
              style={{ color: '#102b50', fontSize: '34px' }}
            >
              Welcome back
            </h1>

            <p className="mb-4" style={{ color: '#526c8f' }}>
              Log in to continue your IELTS journey with Band Buddy.
            </p>

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label
                  htmlFor="login-email"
                  className="form-label fw-semibold"
                >
                  Email address
                </label>

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  className="form-control py-3"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="mb-2">
                <label
                  htmlFor="login-password"
                  className="form-label fw-semibold"
                >
                  Password
                </label>

                <div className="input-group">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="form-control py-3"
                    placeholder="Enter your password"
                    required
                  />

                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="text-end mb-4">
                <button
                  type="button"
                  className="btn btn-link px-0"
                  onClick={() =>
                    setMessage(
                      'Password reset is not available yet. Please try again later.'
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="bb-btn w-100"
              >
                Log in →
              </button>
            </form>

            <div className="d-flex align-items-center gap-3 my-4">
              <hr className="flex-grow-1 m-0" />
              <span style={{ color: '#526c8f', fontSize: '14px' }}>
                or
              </span>
              <hr className="flex-grow-1 m-0" />
            </div>

            <button
              type="button"
              className="btn w-100 py-3 d-flex align-items-center justify-content-center gap-3"
              style={{
                border: '1px solid #c9d9ed',
                borderRadius: '9px',
                color: '#102b50',
                fontWeight: 600,
              }}
              onClick={() =>
                setMessage(
                  'Google sign-in is not available yet. Please try again later.'
                )
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
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
              Continue with Google
            </button>

            {message && (
              <p
                role="status"
                className="mt-3 mb-0 small"
                style={{ color: '#526c8f' }}
              >
                {message}
              </p>
            )}

            <p className="text-center mt-4 mb-0">
              Don’t have an account?{' '}
              <a
                href="/register"
                className="fw-semibold"
                style={{ color: '#0866ed' }}
              >
                Register
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}