import React, { useState, useEffect } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

function Profile({ token, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setErrorMsg('Session expired. Please log in again.');
          if (onLogout) onLogout();
          return;
        }
        throw new Error(data.message || 'Failed to fetch profile.');
      }

      setProfile(data.user);
      setName(data.user.name || '');
      setEmail(data.user.email || '');
    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Name is required.';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      setProfile(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      setErrorMsg(err.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (userName) => {
    if (!userName) return 'ST';
    return userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-secondary" role="status"></div>
        <p className="text-muted mt-3 small">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <div className="foundation-card p-4 p-md-5">
          {/* Header Banner */}
          <div className="d-flex align-items-center gap-3 pb-4 mb-4 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
            <div
              className="avatar-initials"
              style={{ width: '52px', height: '52px', fontSize: '1.25rem' }}
            >
              {getInitials(profile?.name)}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 className="h4 text-slate-900 fw-bold mb-0">{profile?.name || 'Student'}</h1>
                <span className="badge bg-white text-secondary border text-uppercase" style={{ fontSize: '0.68rem' }}>
                  {profile?.role || 'Student'}
                </span>
              </div>
              <p className="text-muted small mb-0">{profile?.email}</p>
            </div>
          </div>

          <h2 className="h5 fw-bold text-slate-900 mb-3">Account Information</h2>

          {/* Alerts */}
          {successMsg && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <strong>Success: </strong> {successMsg}
              <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>Error: </strong> {errorMsg}
              <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleUpdate} noValidate>
            <div className="mb-3">
              <label htmlFor="profile-name" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="profile-name"
                className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                }}
                disabled={saving}
                placeholder="Enter your full name"
              />
              {fieldErrors.name && (
                <div className="invalid-feedback">{fieldErrors.name}</div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="profile-email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="profile-email"
                className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                }}
                disabled={saving}
                placeholder="name@example.com"
              />
              {fieldErrors.email && (
                <div className="invalid-feedback">{fieldErrors.email}</div>
              )}
            </div>

            {/* Read-Only Account Metadata */}
            <div className="p-3 mb-4 rounded bg-light border">
              <div className="row g-2 text-muted small">
                <div className="col-12 col-sm-6">
                  <span>Role: </span>
                  <strong className="text-slate-900 text-capitalize">{profile?.role}</strong>
                </div>
                <div className="col-12 col-sm-6">
                  <span>Member Since: </span>
                  <strong className="text-slate-900">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="d-flex flex-column flex-sm-row gap-2 justify-content-sm-end pt-2">
              <button
                type="button"
                className="btn btn-neutral btn-sm px-3"
                onClick={fetchProfile}
                disabled={saving}
              >
                Reset
              </button>
              <button
                type="submit"
                id="save-profile-btn"
                className="btn btn-accent btn-sm px-4"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
