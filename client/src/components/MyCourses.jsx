import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function MyCourses({ token, onRequireLogin, onNavigateToCourses }) {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyCourses = async () => {
    if (!token) {
      if (onRequireLogin) onRequireLogin();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/mycourses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired or is unauthorized. Please sign in again.');
          if (onRequireLogin) onRequireLogin();
          return;
        }
        throw new Error(data.message || 'Failed to load your enrolled courses.');
      }

      setEnrolledCourses(data.myCourses || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to the course dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, [token]);

  // Format date helper (e.g. 17 Sep 2026)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="container py-2">
      {/* Header Banner */}
      <div className="foundation-card p-4 p-md-5 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div>
            <h1 className="h2 fw-bold text-white mb-1">My Courses</h1>
            <p className="text-secondary small mb-0">
              Track and access your active learning programs and enrollments.
            </p>
          </div>
          <span className="badge bg-primary px-3 py-2">
            {enrolledCourses.length} {enrolledCourses.length === 1 ? 'Course' : 'Courses'} Enrolled
          </span>
        </div>
      </div>

      {/* Error Alert State */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4" role="alert">
          <div>
            <strong>Error: </strong> {error}
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={fetchMyCourses}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-secondary mt-3">Loading your course dashboard...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && enrolledCourses.length === 0 && (
        <div className="foundation-card text-center py-5 px-4 my-3">
          <div className="display-6 mb-3">🎓</div>
          <h3 className="h5 text-white fw-bold">You haven't enrolled in any courses yet.</h3>
          <p className="text-secondary small max-w-md mx-auto mb-4">
            Explore our course catalog to find topics that match your academic and career goals.
          </p>
          <button
            type="button"
            id="browse-courses-btn"
            className="btn btn-primary px-4"
            onClick={onNavigateToCourses}
          >
            Browse Available Courses
          </button>
        </div>
      )}

      {/* Enrolled Courses Grid */}
      {!loading && !error && enrolledCourses.length > 0 && (
        <div className="row g-4" id="my-courses-container">
          {enrolledCourses.map(({ enrollmentId, enrolledAt, course }) => (
            <div key={enrollmentId} className="col-12 col-md-6 col-lg-4">
              <div className="card bg-dark border-secondary h-100 shadow-sm transition-hover">
                <div className="card-body d-flex flex-column p-4">
                  {/* Category & Duration */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge-tech small">
                      {course.category}
                    </span>
                    <small className="text-muted">
                      ⏱ {course.duration || 'Self-paced'}
                    </small>
                  </div>

                  {/* Course Title */}
                  <h2 className="h5 text-white fw-bold mt-2 mb-2">
                    {course.title}
                  </h2>

                  {/* Description */}
                  <p className="text-secondary small flex-grow-1 mb-3">
                    {course.description}
                  </p>

                  <hr className="border-secondary my-3" />

                  {/* Instructor & Enrolled Date Footer */}
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>INSTRUCTOR</span>
                      <strong className="text-light small">{course.instructor}</strong>
                    </div>
                    <div className="text-end">
                      <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>ENROLLED</span>
                      <span className="badge bg-success bg-opacity-75 text-white">
                        {formatDate(enrolledAt)}
                      </span>
                    </div>
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

export default MyCourses;
