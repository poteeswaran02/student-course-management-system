import React, { useState } from 'react';

function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldError, setFieldError] = useState('');

  const validateEmail = (val) => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!val.trim()) {
      return 'Email address is required.';
    }
    if (!emailRegex.test(val.trim())) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const error = validateEmail(email);
    if (error) {
      setFieldError(error);
      return;
    }
    setFieldError('');

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 450);
  };

  return (
    <div className="row justify-content-center py-4">
      <div className="col-12 col-md-8 col-lg-5">
        <div className="foundation-card p-4 p-md-5">
          <div className="text-center mb-4">
            <h1 className="h4 text-slate-900 fw-bold mb-1">Reset Password Request</h1>
            <p className="text-secondary small mb-0">
              Submit your registered email address to request an administrative password reset.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-2">
              <div className="alert alert-info text-start small mb-4" role="alert">
                <h2 className="h6 fw-bold mb-1">Request Received</h2>
                <p className="mb-1">
                  A password reset request for <strong>{email}</strong> has been logged by the system.
                </p>
                <hr className="my-2" />
                <p className="mb-0 text-muted">
                  <em>
                    Note: Automated email dispatch is disabled in this environment. Please reach out to your instructor or system administrator.
                  </em>
                </p>
              </div>

              <div className="d-grid gap-2">
                <button
                  type="button"
                  id="back-to-login-btn"
                  className="btn btn-accent btn-sm py-2"
                  onClick={onBackToLogin}
                >
                  Return to Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-link btn-sm text-secondary text-decoration-none"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                >
                  Submit another request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {errorMessage && (
                <div className="alert alert-danger small py-2 mb-3" role="alert">
                  {errorMessage}
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="forgot-email" className="form-label">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  id="forgot-email"
                  className={`form-control ${fieldError ? 'is-invalid' : ''}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  disabled={loading}
                  placeholder="student@example.com"
                  autoFocus
                />
                {fieldError && (
                  <div className="invalid-feedback">{fieldError}</div>
                )}
                <div className="form-text text-muted small">
                  Enter the email associated with your student account.
                </div>
              </div>

              <div className="d-grid gap-2 mb-3">
                <button
                  type="submit"
                  id="forgot-submit-btn"
                  className="btn btn-accent py-2"
                  disabled={loading}
                >
                  {loading ? 'Submitting Request...' : 'Submit Request'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link btn-sm text-secondary text-decoration-none"
                  onClick={onBackToLogin}
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
