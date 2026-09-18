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

    // Simulate standard request submission UI without faking email transmission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-5">
        <div className="foundation-card p-4 p-md-5">
          <div className="text-center mb-4">
            <h2 className="h4 text-white fw-bold">Reset Password Request</h2>
            <p className="text-secondary small">
              Submit your registered email to initiate an administrative password reset request.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-3">
              <div className="alert alert-info text-start small mb-4" role="alert">
                <h6 className="alert-heading fw-bold">Request Logged</h6>
                <p className="mb-1">
                  A password reset request for <strong>{email}</strong> has been received by the system.
                </p>
                <hr className="my-2" />
                <p className="mb-0 text-muted">
                  <em>
                    Note: Automated email dispatch is disabled in this environment. Please contact your system administrator or course coordinator with this request.
                  </em>
                </p>
              </div>

              <div className="d-grid gap-2">
                <button
                  type="button"
                  id="back-to-login-btn"
                  className="btn btn-outline-primary btn-sm"
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
                <label htmlFor="forgot-email" className="form-label text-light small fw-semibold">
                  Account Email Address
                </label>
                <input
                  type="email"
                  id="forgot-email"
                  className={`form-control bg-dark text-white border-secondary ${fieldError ? 'is-invalid' : ''}`}
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
                <div className="form-text text-secondary small">
                  Enter the email linked to your student account.
                </div>
              </div>

              <div className="d-grid gap-2 mb-3">
                <button
                  type="submit"
                  id="forgot-submit-btn"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Submitting Request...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link btn-sm text-secondary text-decoration-none"
                  onClick={onBackToLogin}
                >
                  &larr; Back to Sign In
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
