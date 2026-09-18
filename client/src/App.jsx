import React, { useState, useEffect } from 'react';
import Profile from './components/Profile';
import ForgotPassword from './components/ForgotPassword';
import AuthModal from './components/AuthModal';
import Courses from './components/Courses';
import MyCourses from './components/MyCourses';
import AdminDashboard from './components/AdminDashboard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function App() {
  // Navigation View: 'home' | 'courses' | 'mycourses' | 'profile' | 'forgot-password' | 'admin'
  const [activeView, setActiveView] = useState('courses');

  // Auth State
  const [token, setToken] = useState(() => localStorage.getItem('sc_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sc_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Health Data State
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setHealthError(err.message || 'Unable to connect to backend server');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('sc_token', newToken);
    localStorage.setItem('sc_user', JSON.stringify(newUser));
    // If logged in as admin, optionally switch to admin view or remain on courses
    if (newUser?.role === 'admin') {
      setActiveView('admin');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    setActiveView('courses');
  };

  const handleNavigateToProfile = () => {
    if (!token) {
      setIsAuthModalOpen(true);
    } else {
      setActiveView('profile');
    }
  };

  const handleNavigateToMyCourses = () => {
    if (!token) {
      setIsAuthModalOpen(true);
    } else {
      setActiveView('mycourses');
    }
  };

  const handleNavigateToAdmin = () => {
    if (!token) {
      setIsAuthModalOpen(true);
    } else {
      setActiveView('admin');
    }
  };


  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navigation Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary px-3 px-md-4 py-3">
        <div className="container-fluid">
          <button
            type="button"
            className="navbar-brand btn btn-link text-primary text-decoration-none fw-bold p-0 me-4"
            onClick={() => setActiveView('courses')}
          >
            🎓 Student Course Management System
          </button>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navContent"
            aria-controls="navContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button
                  type="button"
                  id="nav-courses-btn"
                  className={`nav-link btn btn-link text-decoration-none ${activeView === 'courses' ? 'active text-primary fw-semibold' : 'text-secondary'}`}
                  onClick={() => setActiveView('courses')}
                >
                  Available Courses
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  id="nav-mycourses-btn"
                  className={`nav-link btn btn-link text-decoration-none ${activeView === 'mycourses' ? 'active text-primary fw-semibold' : 'text-secondary'}`}
                  onClick={handleNavigateToMyCourses}
                >
                  My Courses {token && <span className="badge bg-success ms-1">Active</span>}
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  id="nav-overview-btn"
                  className={`nav-link btn btn-link text-decoration-none ${activeView === 'home' ? 'active text-primary fw-semibold' : 'text-secondary'}`}
                  onClick={() => setActiveView('home')}
                >
                  System Overview
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  id="nav-profile-btn"
                  className={`nav-link btn btn-link text-decoration-none ${activeView === 'profile' ? 'active text-primary fw-semibold' : 'text-secondary'}`}
                  onClick={handleNavigateToProfile}
                >
                  My Profile
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  id="nav-forgot-btn"
                  className={`nav-link btn btn-link text-decoration-none ${activeView === 'forgot-password' ? 'active text-primary fw-semibold' : 'text-secondary'}`}
                  onClick={() => setActiveView('forgot-password')}
                >
                  Forgot Password
                </button>
              </li>
              {user?.role === 'admin' && (
                <li className="nav-item">
                  <button
                    type="button"
                    id="nav-admin-btn"
                    className={`nav-link btn btn-link text-decoration-none ${activeView === 'admin' ? 'active text-danger fw-bold' : 'text-danger'}`}
                    onClick={handleNavigateToAdmin}
                  >
                    🛡️ Admin Dashboard <span className="badge bg-danger ms-1">Admin</span>
                  </button>
                </li>
              )}
            </ul>


            {/* Auth Actions */}
            <div className="d-flex align-items-center gap-2">
              {token ? (
                <div className="d-flex align-items-center gap-2">
                  <span className="text-light small d-none d-md-inline">
                    Signed in as <strong className="text-info">{user?.name || user?.email}</strong>
                  </span>
                  <button
                    type="button"
                    id="signout-btn"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="signin-btn"
                  className="btn btn-primary btn-sm px-3"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Body */}
      <main className="container my-4 flex-grow-1">
        {/* VIEW 1: AVAILABLE COURSES */}
        {activeView === 'courses' && (
          <Courses
            token={token}
            onRequireLogin={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* VIEW 2: MY COURSES DASHBOARD (PROTECTED) */}
        {activeView === 'mycourses' && (
          <MyCourses
            token={token}
            onRequireLogin={() => setIsAuthModalOpen(true)}
            onNavigateToCourses={() => setActiveView('courses')}
          />
        )}

        {/* VIEW 3: HOME / SYSTEM OVERVIEW */}
        {activeView === 'home' && (
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              <div className="foundation-card p-4 p-md-5 mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                  <div>
                    <h1 className="h2 fw-bold text-white mb-1">
                      Student Course Management System
                    </h1>
                    <p className="text-secondary mb-0">
                      Step 8: Admin Features Active
                    </p>
                  </div>
                  <span className="badge bg-danger px-3 py-2">Stage 8 Active</span>
                </div>

                <div className="d-flex flex-wrap gap-2 my-4">
                  <button
                    type="button"
                    id="home-courses-shortcut-btn"
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveView('courses')}
                  >
                    📚 Browse Available Courses
                  </button>
                  <button
                    type="button"
                    id="home-mycourses-shortcut-btn"
                    className="btn btn-outline-success btn-sm"
                    onClick={handleNavigateToMyCourses}
                  >
                    🎓 My Enrolled Courses
                  </button>
                  <button
                    type="button"
                    id="home-profile-shortcut-btn"
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleNavigateToProfile}
                  >
                    👤 Manage Profile
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      id="home-admin-shortcut-btn"
                      className="btn btn-outline-danger btn-sm"
                      onClick={handleNavigateToAdmin}
                    >
                      🛡️ Admin Dashboard
                    </button>
                  )}
                  <button
                    type="button"
                    id="home-forgot-shortcut-btn"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setActiveView('forgot-password')}
                  >
                    🔑 Forgot Password Request
                  </button>
                </div>


                <hr className="border-secondary my-4" />

                {/* Live Backend Health Monitor */}
                <div className="card bg-dark border-secondary p-3 p-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h6 mb-0 text-white d-flex align-items-center">
                      <span className={`pulse-dot ${loadingHealth ? 'pulse-dot-warning' : healthError ? 'pulse-dot-danger' : 'pulse-dot-success'}`}></span>
                      Backend Service Status (<code className="text-info">GET /health</code>)
                    </h2>
                    <button
                      id="refresh-health-btn"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={fetchHealth}
                      disabled={loadingHealth}
                    >
                      {loadingHealth ? 'Checking...' : 'Refresh'}
                    </button>
                  </div>

                  {healthData && !loadingHealth && (
                    <div className="row g-3">
                      <div className="col-sm-4">
                        <div className="p-3 rounded bg-black bg-opacity-25 border border-secondary text-center">
                          <small className="text-muted text-uppercase d-block mb-1">Server</small>
                          <span className="badge badge-ready">{healthData.status}</span>
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="p-3 rounded bg-black bg-opacity-25 border border-secondary text-center">
                          <small className="text-muted text-uppercase d-block mb-1">Database</small>
                          <span className={`badge ${healthData.database?.status === 'connected' ? 'badge-ready' : 'bg-warning text-dark'}`}>
                            {healthData.database?.status || 'unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="p-3 rounded bg-black bg-opacity-25 border border-secondary text-center">
                          <small className="text-muted text-uppercase d-block mb-1">Uptime</small>
                          <strong className="text-white">{healthData.uptime}s</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: PROFILE (PROTECTED) */}
        {activeView === 'profile' && (
          <div>
            {token ? (
              <Profile token={token} onLogout={handleLogout} />
            ) : (
              <div className="row justify-content-center">
                <div className="col-12 col-md-6 text-center py-5 foundation-card">
                  <h3 className="text-white fw-bold mb-3">Authentication Required</h3>
                  <p className="text-secondary mb-4">
                    You need to be signed in to view and update your student profile.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={() => setIsAuthModalOpen(true)}
                  >
                    Sign In Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: FORGOT PASSWORD (PUBLIC) */}
        {activeView === 'forgot-password' && (
          <ForgotPassword
            onBackToLogin={() => {
              setActiveView('courses');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {/* VIEW 6: ADMIN DASHBOARD (PROTECTED - ADMIN ONLY) */}
        {activeView === 'admin' && (
          <AdminDashboard
            token={token}
            user={user}
            onRequireLogin={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Auth Modal for Login & Registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onNavigateToForgot={() => setActiveView('forgot-password')}
      />

      {/* Footer */}
      <footer className="py-3 text-center text-secondary border-top border-secondary small">
        Student Course Management System &copy; {new Date().getFullYear()} — Step 8 Complete (Admin Features Active)
      </footer>

    </div>
  );
}

export default App;
