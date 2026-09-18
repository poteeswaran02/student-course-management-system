import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function Courses({ token, onRequireLogin }) {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrollFeedback, setEnrollFeedback] = useState(null);
  const debounceTimerRef = useRef(null);

  // Fetch courses from backend API (MongoDB)
  const fetchCourses = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const url = query.trim()
        ? `${API_BASE_URL}/courses?search=${encodeURIComponent(query.trim())}`
        : `${API_BASE_URL}/courses`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch courses.');
      }

      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to course service.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCourses('');
  }, []);

  // Handle search input with 350ms debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchCourses(val);
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    fetchCourses('');
  };

  // Handle student enrollment
  const handleEnroll = async (course) => {
    setEnrollFeedback(null);

    // If visitor is unauthenticated, prompt login
    if (!token) {
      if (onRequireLogin) onRequireLogin();
      setEnrollFeedback({
        type: 'warning',
        message: 'Please sign in or create an account to enroll in courses.',
      });
      return;
    }

    setEnrollingId(course._id);
    try {
      const response = await fetch(`${API_BASE_URL}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId: course._id }),
      });

      const data = await response.json();

      if (response.status === 201) {
        setEnrollFeedback({
          type: 'success',
          message: `Successfully enrolled in "${course.title}"!`,
        });
      } else if (response.status === 409) {
        setEnrollFeedback({
          type: 'info',
          message: `You are already enrolled in "${course.title}".`,
        });
      } else if (response.status === 401) {
        setEnrollFeedback({
          type: 'danger',
          message: 'Session expired. Please sign in again to enroll.',
        });
        if (onRequireLogin) onRequireLogin();
      } else {
        setEnrollFeedback({
          type: 'danger',
          message: data.message || 'Enrollment failed. Please try again.',
        });
      }
    } catch (err) {
      setEnrollFeedback({
        type: 'danger',
        message: err.message || 'Unable to communicate with the enrollment server.',
      });
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="container py-2">
      {/* Header & Search Bar */}
      <div className="foundation-card p-4 p-md-5 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <div>
            <h1 className="h2 fw-bold text-white mb-1">Available Courses</h1>
            <p className="text-secondary small mb-0">
              Browse our catalog of learning programs, explore course syllabi, and enroll today.
            </p>
          </div>
          <span className="badge bg-primary px-3 py-2">
            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Available
          </span>
        </div>

        {/* Global Enrollment Feedback Banner */}
        {enrollFeedback && (
          <div
            id="enroll-feedback-alert"
            className={`alert alert-${enrollFeedback.type} alert-dismissible fade show mt-3 mb-2`}
            role="alert"
          >
            <strong>{enrollFeedback.type === 'success' ? 'Enrollment Confirmed: ' : enrollFeedback.type === 'info' ? 'Notice: ' : 'Alert: '}</strong>
            {enrollFeedback.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setEnrollFeedback(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Search Control */}
        <div className="row g-2 mt-3">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="input-group">
              <span className="input-group-text bg-black border-secondary text-secondary">
                🔍
              </span>
              <input
                type="text"
                id="course-search-input"
                className="form-control bg-dark text-white border-secondary"
                placeholder="Search courses by title, category, or instructor..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button
                  type="button"
                  id="clear-search-btn"
                  className="btn btn-outline-secondary"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="form-text text-info small mt-1">
                Searching for: <em>"{searchTerm}"</em>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert State */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4" role="alert">
          <div>
            <strong>Error Loading Courses:</strong> {error}
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => fetchCourses(searchTerm)}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-secondary mt-3">Querying available courses from database...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && courses.length === 0 && (
        <div className="foundation-card text-center py-5 px-4 my-3">
          <div className="display-6 mb-3">📚</div>
          <h3 className="h5 text-white fw-bold">
            {searchTerm ? 'No Courses Match Your Search' : 'No Courses Available Yet'}
          </h3>
          <p className="text-secondary small max-w-md mx-auto mb-4">
            {searchTerm
              ? `We couldn't find any courses matching "${searchTerm}". Try checking your spelling or searching for a different topic.`
              : 'The course catalog is currently being updated. Please check back shortly!'}
          </p>
          {searchTerm && (
            <button
              type="button"
              id="reset-search-btn"
              className="btn btn-outline-primary btn-sm px-4"
              onClick={handleClearSearch}
            >
              Clear Search & Show All
            </button>
          )}
        </div>
      )}

      {/* Course Cards Grid */}
      {!loading && !error && courses.length > 0 && (
        <div className="row g-4" id="course-list-container">
          {courses.map((course) => (
            <div key={course._id} className="col-12 col-md-6 col-lg-4">
              <div className="card bg-dark border-secondary h-100 shadow-sm transition-hover">
                <div className="card-body d-flex flex-column p-4">
                  {/* Category, Fee & Duration */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge-tech small">
                      {course.category}
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge ${course.fee > 0 ? 'bg-success text-white' : 'bg-secondary text-light'} small`}>
                        {course.fee > 0 ? `$${course.fee}` : 'Free'}
                      </span>
                      <small className="text-muted">
                        ⏱ {course.duration || 'Self-paced'}
                      </small>
                    </div>
                  </div>


                  {/* Title */}
                  <h2 className="h5 text-white fw-bold mt-2 mb-2">
                    {course.title}
                  </h2>

                  {/* Description */}
                  <p className="text-secondary small flex-grow-1 mb-3">
                    {course.description}
                  </p>

                  <hr className="border-secondary my-3" />

                  {/* Instructor & Enroll Action */}
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="small">
                      <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>INSTRUCTOR</span>
                      <strong className="text-light">{course.instructor}</strong>
                    </div>

                    <button
                      type="button"
                      id={`enroll-btn-${course._id}`}
                      className="btn btn-primary btn-sm px-3"
                      onClick={() => handleEnroll(course)}
                      disabled={enrollingId === course._id}
                    >
                      {enrollingId === course._id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                          Enrolling...
                        </>
                      ) : (
                        'Enroll'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Courses;
