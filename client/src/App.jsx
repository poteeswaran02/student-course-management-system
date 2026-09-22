import React, { useState, useEffect } from 'react';
import Profile from './components/Profile';
import ForgotPassword from './components/ForgotPassword';
import AuthModal from './components/AuthModal';
import Courses from './components/Courses';
import MyCourses from './components/MyCourses';
import AdminDashboard from './components/AdminDashboard';
import { CapIcon, MenuIcon } from './components/Icons';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

function App() {
  // Active View: 'courses' | 'mycourses' | 'home' | 'profile' | 'forgot-password' | 'admin'
  const [activeView, setActiveView] = useState('courses');

  // Auth State
  const [token, setToken] = useState(() => localStorage.getItem('sc_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sc_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Health Data State
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      }
    } catch (err) {
      // Ignore
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
    if (newUser?.role === 'admin') {
      setActiveView('admin');
    }
  };

  const navigateTo = (view) => {
    setActiveView(view);
    setIsNavOpen(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    setIsNavOpen(false);
    setActiveView('courses');
  };

  const handleNavigateToProfile = () => {
    setIsNavOpen(false);
    if (!token) {
      setIsAuthModalOpen(true);
    } else {
      setActiveView('profile');
    }
  };

  const handleNavigateToMyCourses = () => {
    setIsNavOpen(false);
    if (!token) {
      setIsAuthModalOpen(true);
    } else {
      setActiveView('mycourses');
    }
  };

  const handleNavigateToAdmin = () => {
    setIsNavOpen(false);
    if (!token) {
      setIsAuthModalOpen(true);
    } else {
      setActiveView('admin');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* ========================================================================= */}
      {/* NAVBAR: StudentLearn Authentic Professional Navigation                   */}
      {/* ========================================================================= */}
      <header className="sticky-top edu-navbar">
        <div className="container-xl px-3 px-md-4">
          <nav className="navbar navbar-expand-lg p-0" style={{ minHeight: '64px' }}>
            <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
              {/* Brand / Logo (Left) */}
              <button
                type="button"
                className="brand-title btn btn-link text-decoration-none p-0 me-3 me-lg-4 d-flex align-items-center gap-2"
                onClick={() => navigateTo('courses')}
                title="StudentLearn - Online Learning Platform"
              >
                <span className="brand-icon-box">
                  <CapIcon size={18} />
                </span>
                <span>StudentLearn</span>
              </button>

              {/* Mobile Hamburger Toggler (Clean SVG) */}
              <button
                className="navbar-toggler border-0 p-1 text-dark d-lg-none"
                type="button"
                onClick={() => setIsNavOpen(!isNavOpen)}
                aria-controls="navContent"
                aria-expanded={isNavOpen}
                aria-label="Toggle navigation"
              >
                <MenuIcon size={22} />
              </button>

              {/* Menu Links */}
              <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="navContent">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-lg-1">
                  <li className="nav-item">
                    <button
                      type="button"
                      id="nav-courses-btn"
                      className={`nav-link-item btn btn-link text-start ${activeView === 'courses' ? 'active' : ''}`}
                      onClick={() => navigateTo('courses')}
                    >
                      Courses
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      id="nav-mycourses-btn"
                      className={`nav-link-item btn btn-link text-start ${activeView === 'mycourses' ? 'active' : ''}`}
                      onClick={handleNavigateToMyCourses}
                    >
                      My Courses
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      id="nav-overview-btn"
                      className={`nav-link-item btn btn-link text-start ${activeView === 'home' ? 'active' : ''}`}
                      onClick={() => navigateTo('home')}
                    >
                      About
                    </button>
                  </li>
                  {token && (
                    <li className="nav-item">
                      <button
                        type="button"
                        id="nav-profile-btn"
                        className={`nav-link-item btn btn-link text-start ${activeView === 'profile' ? 'active' : ''}`}
                        onClick={handleNavigateToProfile}
                      >
                        Profile
                      </button>
                    </li>
                  )}
                  {user?.role === 'admin' && (
                    <li className="nav-item">
                      <button
                        type="button"
                        id="nav-admin-btn"
                        className={`nav-link-item btn btn-link text-start text-danger fw-semibold ${activeView === 'admin' ? 'active' : ''}`}
                        onClick={handleNavigateToAdmin}
                      >
                        Admin
                      </button>
                    </li>
                  )}
                </ul>

                {/* Right Action: Auth / Profile Pill (Compact, Auto-Width) */}
                <div className="navbar-auth-section d-flex align-items-center gap-2">
                  {token ? (
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center gap-2 px-2 py-1 bg-white border rounded">
                        <span className="avatar-initials" style={{ width: '26px', height: '26px', fontSize: '0.72rem' }}>
                          {getInitials(user?.name || user?.email)}
                        </span>
                        <span className="small fw-semibold text-truncate text-slate-800" style={{ maxWidth: '130px' }}>
                          {user?.name || user?.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        id="signout-btn"
                        className="btn btn-neutral btn-sm"
                        onClick={handleLogout}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="signin-btn"
                      className="btn btn-accent btn-sm navbar-auth-btn"
                      onClick={() => {
                        setIsNavOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                    >
                      Login / Register
                    </button>
                  )}
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow-1">
        {/* VIEW 1: AVAILABLE COURSES */}
        {activeView === 'courses' && (
          <Courses
            token={token}
            onRequireLogin={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* VIEW 2: MY COURSES DASHBOARD */}
        {activeView === 'mycourses' && (
          <div className="container-xl px-3 px-md-4 py-4">
            <MyCourses
              token={token}
              onRequireLogin={() => setIsAuthModalOpen(true)}
              onNavigateToCourses={() => setActiveView('courses')}
            />
          </div>
        )}

        {/* VIEW 3: ABOUT / PLATFORM OVERVIEW */}
        {activeView === 'home' && (
          <div className="container-xl px-3 px-md-4 py-4">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-10">
                <div className="foundation-card p-4 p-md-5 mb-4">
                  <div className="mb-4">
                    <span className="hero-tag">Platform Overview</span>
                    <h1 className="h3 fw-bold text-slate-900 mb-2">
                      About StudentLearn
                    </h1>
                    <p className="text-secondary mb-0">
                      StudentLearn is an online course platform providing university students and professionals with career-focused skills in software engineering, data science, and cloud computing.
                    </p>
                  </div>

                  <div className="row g-3 my-2">
                    <div className="col-12 col-md-4">
                      <div className="p-3 rounded bg-light border h-100">
                        <h3 className="h6 fw-bold mb-1 text-slate-900">Structured Curriculum</h3>
                        <p className="text-muted small mb-0">Practical modules designed for clear understanding from foundational concepts to production deployment.</p>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 rounded bg-light border h-100">
                        <h3 className="h6 fw-bold mb-1 text-slate-900">Direct Enrollment</h3>
                        <p className="text-muted small mb-0">Enroll instantly into available courses and manage your ongoing learning from the student dashboard.</p>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 rounded bg-light border h-100">
                        <h3 className="h6 fw-bold mb-1 text-slate-900">Authenticated Security</h3>
                        <p className="text-muted small mb-0">Role-based access control protecting student account data and administrator capabilities.</p>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 my-4 pt-2">
                    <button
                      type="button"
                      id="home-courses-shortcut-btn"
                      className="btn btn-accent btn-sm"
                      onClick={() => navigateTo('courses')}
                    >
                      Explore Courses
                    </button>
                    <button
                      type="button"
                      id="home-mycourses-shortcut-btn"
                      className="btn btn-neutral btn-sm"
                      onClick={handleNavigateToMyCourses}
                    >
                      My Courses
                    </button>
                    <button
                      type="button"
                      id="home-profile-shortcut-btn"
                      className="btn btn-neutral btn-sm"
                      onClick={handleNavigateToProfile}
                    >
                      Profile
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        type="button"
                        id="home-admin-shortcut-btn"
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleNavigateToAdmin}
                      >
                        Admin Control
                      </button>
                    )}
                    <button
                      type="button"
                      id="home-forgot-shortcut-btn"
                      className="btn btn-link btn-sm text-secondary text-decoration-none"
                      onClick={() => navigateTo('forgot-password')}
                    >
                      Password Reset
                    </button>
                  </div>

                  <hr className="my-4" />

                  {/* Service Health */}
                  <div className="p-3 rounded bg-light border">
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                      <h2 className="h6 mb-0 text-slate-900">
                        System Health Status (<code className="text-muted">GET /health</code>)
                      </h2>
                      <button
                        id="refresh-health-btn"
                        className="btn btn-neutral btn-sm"
                        onClick={fetchHealth}
                        disabled={loadingHealth}
                      >
                        {loadingHealth ? 'Checking...' : 'Refresh'}
                      </button>
                    </div>

                    {healthData && !loadingHealth && (
                      <div className="row g-2 text-center">
                        <div className="col-12 col-sm-4">
                          <div className="p-2 bg-white rounded border text-muted small">
                            API Gateway: <strong className="text-success">{healthData.status}</strong>
                          </div>
                        </div>
                        <div className="col-12 col-sm-4">
                          <div className="p-2 bg-white rounded border text-muted small">
                            Database: <strong className="text-success">{healthData.database?.status || 'connected'}</strong>
                          </div>
                        </div>
                        <div className="col-12 col-sm-4">
                          <div className="p-2 bg-white rounded border text-muted small">
                            Uptime: <strong className="text-slate-900">{healthData.uptime}s</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: PROFILE */}
        {activeView === 'profile' && (
          <div className="container-xl px-3 px-md-4 py-4">
            {token ? (
              <Profile token={token} onLogout={handleLogout} />
            ) : (
              <div className="row justify-content-center">
                <div className="col-12 col-md-6 text-center py-5 foundation-card p-4">
                  <h3 className="fw-bold mb-2">Student Authentication Required</h3>
                  <p className="text-secondary mb-4 small">
                    Please log in or create an account to view your student profile.
                  </p>
                  <button
                    type="button"
                    className="btn btn-accent px-4 py-2"
                    onClick={() => setIsAuthModalOpen(true)}
                  >
                    Log In
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: FORGOT PASSWORD */}
        {activeView === 'forgot-password' && (
          <div className="container-xl px-3 px-md-4 py-4">
            <ForgotPassword
              onBackToLogin={() => {
                setActiveView('courses');
                setIsAuthModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 6: ADMIN DASHBOARD */}
        {activeView === 'admin' && (
          <div className="container-xl px-3 px-md-4 py-4">
            <AdminDashboard
              token={token}
              user={user}
              onRequireLogin={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onNavigateToForgot={() => setActiveView('forgot-password')}
      />

      {/* Professional Educational Footer */}
      <footer className="edu-footer mt-auto">
        <div className="container-xl px-3 px-md-4">
          <div className="row g-4 g-lg-5 align-items-start">
            {/* Column 1: StudentLearn Brand & Mission */}
            <div className="col-12 col-md-5 col-lg-5">
              <div className="footer-brand mb-2 d-flex align-items-center gap-2">
                <span className="brand-icon-box">
                  <CapIcon size={18} />
                </span>
                <span className="fw-bold text-dark fs-5">StudentLearn</span>
              </div>
              <p className="footer-desc text-muted mb-0" style={{ maxWidth: '380px' }}>
                Learn, grow, and build your skills with career-focused online courses taught by industry professionals.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="col-6 col-md-3 col-lg-3">
              <h4 className="footer-heading">Quick Links</h4>
              <div className="footer-links-grid">
                <button type="button" className="footer-link-btn" id="footer-courses-btn" onClick={() => navigateTo('courses')}>
                  Courses
                </button>
                <button type="button" className="footer-link-btn" id="footer-mycourses-btn" onClick={handleNavigateToMyCourses}>
                  My Courses
                </button>
                <button type="button" className="footer-link-btn" id="footer-profile-btn" onClick={handleNavigateToProfile}>
                  Profile
                </button>
                <button type="button" className="footer-link-btn" id="footer-about-btn" onClick={() => navigateTo('home')}>
                  About
                </button>
              </div>
            </div>

            {/* Column 3: Course Platform Overview */}
            <div className="col-6 col-md-4 col-lg-4">
              <h4 className="footer-heading">Course Platform</h4>
              <p className="footer-desc text-muted mb-0">
                Online learning platform providing structured curriculum, interactive course tracking, and verified certificates.
              </p>
            </div>
          </div>

          {/* Subtle Divider */}
          <div className="footer-divider" />

          {/* Bottom Copyright Bar */}
          <div className="footer-bottom d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 text-muted small">
            <div>&copy; {new Date().getFullYear()} StudentLearn. All rights reserved.</div>
            <div className="text-muted small">Career-ready education for everyone</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
