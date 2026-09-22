import React, { useState } from 'react';
import { CapIcon, CloseIcon, EyeIcon, EyeOffIcon } from './Icons';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

function AuthModal({ isOpen, onClose, onAuthSuccess, onNavigateToForgot }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      errors.email = 'Please enter a valid email address.';
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
      style={{ backgroundColor: 'rgba(31, 41, 55, 0.6)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered mx-2 mx-sm-auto" style={{ maxWidth: '420px' }}>
        <div className="modal-content">
          <div className="modal-header d-flex justify-content-between align-items-center pb-2">
            <div className="d-flex align-items-center gap-2">
              <span className="brand-icon-box" style={{ width: '28px', height: '28px' }}>
                <CapIcon size={16} />
              </span>
              <span className="fw-bold text-slate-900" style={{ fontSize: '1.05rem' }}>StudentLearn</span>
            </div>
            <button
              type="button"
              className="btn btn-link p-1 text-muted"
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="modal-body p-3 p-sm-4">
            <div className="text-center mb-3">
              <h2 className="h5 fw-bold text-slate-900 mb-1">
                {tab === 'login' ? 'Welcome Back' : 'Create Student Account'}
              </h2>
              <p className="text-muted small mb-0">
                {tab === 'login' ? 'Sign in to access your enrolled courses' : 'Create an account to begin learning'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="d-flex p-1 bg-light rounded border mb-3">
              <button
                type="button"
                className={`btn btn-sm flex-fill ${tab === 'login' ? 'bg-white text-slate-900 fw-semibold border shadow-xs' : 'text-muted border-0'}`}
                onClick={() => { setTab('login'); setError(''); setFieldErrors({}); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`btn btn-sm flex-fill ${tab === 'register' ? 'bg-white text-slate-900 fw-semibold border shadow-xs' : 'text-muted border-0'}`}
                onClick={() => { setTab('register'); setError(''); setFieldErrors({}); }}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small mb-3" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {tab === 'register' && (
                <div className="mb-3">
                  <label className="form-label small">Full Name</label>
                  <input
                    type="text"
                    id="modal-name-input"
                    className={`form-control form-control-sm ${fieldErrors.name ? 'is-invalid' : ''}`}
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
                <label className="form-label small">Email Address</label>
                <input
                  type="email"
                  id="modal-email-input"
                  className={`form-control form-control-sm ${fieldErrors.email ? 'is-invalid' : ''}`}
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
                <label className="form-label small">Password</label>
                <div className="input-group input-group-sm">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="modal-password-input"
                    className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="btn btn-neutral border-start-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <div className="text-danger small mt-1" style={{ fontSize: '0.8rem' }}>{fieldErrors.password}</div>
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
                    className="btn btn-link btn-sm text-secondary p-0 text-decoration-none small"
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
                  className="btn btn-accent btn-sm py-2"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : tab === 'login' ? 'Sign In' : 'Create Account'}
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
