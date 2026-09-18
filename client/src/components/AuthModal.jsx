import React, { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function AuthModal({ isOpen, onClose, onAuthSuccess, onNavigateToForgot }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

    if (tab === 'register') {
      if (!name.trim()) {
        errors.name = 'Full name is required.';
      } else if (name.trim().length < 2) {
        errors.name = 'Full name must be at least 2 characters.';
      }
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. user@example.com).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const endpoint = tab === 'login' ? '/login' : '/register';
    const payload = tab === 'login' 
      ? { email: email.trim(), password }
      : { name: name.trim(), email: email.trim(), password };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication request failed.');
      }

      if (tab === 'register') {
        // Automatically log in newly registered user
        const loginRes = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const loginData = await loginRes.json();
        onAuthSuccess(loginData.token, loginData.user);
      } else {
        onAuthSuccess(data.token, data.user);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-white border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title fw-bold">
              {tab === 'login' ? 'Sign In' : 'Create Student Account'}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body p-4">
            {/* Tabs */}
            <ul className="nav nav-pills nav-fill mb-3 bg-black bg-opacity-25 p-1 rounded">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link btn-sm py-2 ${tab === 'login' ? 'active' : 'text-secondary'}`}
                  onClick={() => { setTab('login'); setError(''); setFieldErrors({}); }}
                >
                  Sign In
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link btn-sm py-2 ${tab === 'register' ? 'active' : 'text-secondary'}`}
                  onClick={() => { setTab('register'); setError(''); setFieldErrors({}); }}
                >
                  Register
                </button>
              </li>
            </ul>

            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {tab === 'register' && (
                <div className="mb-3">
                  <label className="form-label small text-secondary">Full Name</label>
                  <input
                    type="text"
                    id="modal-name-input"
                    className={`form-control form-control-sm bg-black text-white border-secondary ${fieldErrors.name ? 'is-invalid' : ''}`}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                    }}
                    placeholder="Alice Smith"
                  />
                  {fieldErrors.name && (
                    <div className="invalid-feedback">{fieldErrors.name}</div>
                  )}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label small text-secondary">Email Address</label>
                <input
                  type="email"
                  id="modal-email-input"
                  className={`form-control form-control-sm bg-black text-white border-secondary ${fieldErrors.email ? 'is-invalid' : ''}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                  }}
                  placeholder="student@example.com"
                />
                {fieldErrors.email && (
                  <div className="invalid-feedback">{fieldErrors.email}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary">Password</label>
                <input
                  type="password"
                  id="modal-password-input"
                  className={`form-control form-control-sm bg-black text-white border-secondary ${fieldErrors.password ? 'is-invalid' : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                  }}
                  placeholder="••••••••"
                />
                {fieldErrors.password && (
                  <div className="invalid-feedback">{fieldErrors.password}</div>
                )}
                {tab === 'register' && !fieldErrors.password && (
                  <div className="form-text text-muted small">Must be at least 6 characters.</div>
                )}
              </div>


              {tab === 'login' && (
                <div className="text-end mb-3">
                  <button
                    type="button"
                    id="modal-forgot-password-link"
                    className="btn btn-link btn-sm text-info p-0 text-decoration-none small"
                    onClick={() => {
                      onClose();
                      onNavigateToForgot();
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <div className="d-grid mt-4">
                <button
                  type="submit"
                  id="modal-auth-submit-btn"
                  className="btn btn-primary btn-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : tab === 'login' ? (
                    'Sign In'
                  ) : (
                    'Register Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
