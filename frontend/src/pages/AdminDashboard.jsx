import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../App.css';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    if (!sessionStorage.getItem('band_buddy_access_token')) {
      navigate('/login', { replace: true });
      return;
    }

    async function checkAccess() {
      setError('');
      setUser(null);

      try {
        const response = await api.get('/auth/admin-check');

        if (active) {
          setUser(response.data);
        }
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 401) {
          sessionStorage.removeItem('band_buddy_access_token');
          navigate('/login', { replace: true });
        } else if (err.response?.status === 403) {
          navigate('/dashboard', { replace: true });
        } else {
          setError('Could not load your admin dashboard. Please try again.');
        }
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [navigate, retry]);

  function handleLogout() {
    sessionStorage.removeItem('band_buddy_access_token');
    navigate('/login', { replace: true });
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f3f7fd',
        color: '#102b50',
        fontSize: '17px',
      }}
    >
      <header
        style={{
          background: '#102b50',
          borderBottom: '3px solid #78b6ff',
        }}
      >
        <nav
          className="container d-flex align-items-center justify-content-between gap-3 py-3"
          aria-label="Admin navigation"
        >
          <Link
            to="/"
            style={{
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '26px',
              fontWeight: 800,
            }}
          >
            Band Buddy
          </Link>

          {user && (
            <div className="d-flex align-items-center gap-3">
              <span style={{ color: '#ffffff' }}>
                {user.full_name}
              </span>

              <button
                type="button"
                className="btn btn-outline-light"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          )}
        </nav>
      </header>

      <main className="container py-5">
        {error ? (
          <div role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="bb-btn"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        ) : !user ? (
          <p role="status">Loading your admin dashboard...</p>
        ) : (
          <>
            <section
              style={{
                padding: 'clamp(24px, 5vw, 48px)',
                borderRadius: '24px',
                background: 'linear-gradient(120deg, #dceeff, #edf6ff)',
                border: '1px solid #c9dfff',
              }}
            >
              <p
                className="fw-semibold mb-3"
                style={{
                  color: '#0866ed',
                  letterSpacing: '2px',
                  fontSize: '14px',
                }}
              >
                ADMIN WORKSPACE
              </p>

              <h1
                className="fw-bold"
                style={{ fontSize: 'clamp(30px, 4vw, 44px)' }}
              >
                Welcome, {user.full_name}!
              </h1>

              <p className="mb-0 mt-3" style={{ color: '#526c8f' }}>
                Your Band Buddy admin access is active.
              </p>
            </section>

            <section
              className="mt-4 p-4"
              style={{
                background: '#ffffff',
                border: '1px solid #dce8f6',
                borderRadius: '20px',
              }}
            >
              <h2 className="fw-bold" style={{ fontSize: '25px' }}>
                Your workspace
              </h2>

              <p style={{ color: '#526c8f' }}>
                Question management and student management will be added here.
              </p>

              <Link className="bb-btn d-inline-block" to="/dashboard">
                Open practice dashboard →
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
