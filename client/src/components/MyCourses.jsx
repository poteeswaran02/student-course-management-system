import React, { useState, useEffect } from 'react';
import { getCourseThumbnail } from '../utils/courseImages';
import { ClockIcon, CloseIcon } from './Icons';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

function MyCourses({ token, onRequireLogin, onNavigateToCourses }) {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [learningCourseModal, setLearningCourseModal] = useState(null);

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
          setError('Your session has expired. Please sign in again.');
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

  const getInitials = (name) => {
    if (!name) return 'ED';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-2" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="h3 fw-bold text-slate-900 mb-1">My Learning</h1>
          <p className="text-secondary small mb-0">
            Access your enrolled courses and continue your studies.
          </p>
        </div>
        <span className="badge bg-white text-secondary border px-3 py-2 small">
          {enrolledCourses.length} {enrolledCourses.length === 1 ? 'Enrolled Course' : 'Enrolled Courses'}
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4" role="alert">
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
          <div className="spinner-border text-secondary" role="status"></div>
          <p className="text-muted mt-3 small">Loading your enrolled courses...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && enrolledCourses.length === 0 && (
        <div className="foundation-card text-center py-5 px-3 px-sm-4 my-3">
          <h2 className="h5 fw-bold mb-2">You haven't enrolled in any courses yet.</h2>
          <p className="text-secondary small max-w-md mx-auto mb-4" style={{ maxWidth: '440px' }}>
            Explore our course catalog to find topics that match your academic and career goals.
          </p>
          <button
            type="button"
            id="browse-courses-btn"
            className="btn btn-accent px-4 py-2"
            onClick={onNavigateToCourses}
          >
            Explore Courses
          </button>
        </div>
      )}

      {/* Enrolled Courses Grid */}
      {!loading && !error && enrolledCourses.length > 0 && (
        <div className="row g-3 g-md-4" id="my-courses-container">
          {enrolledCourses.map(({ enrollmentId, enrolledAt, course }) => {
            const thumbnail = getCourseThumbnail(course);
            return (
              <div key={enrollmentId} className="col-12 col-md-6 col-lg-4">
                <div className="course-card">
                  {/* Real Course Thumbnail */}
                  <div className="course-img-wrapper">
                    <img
                      src={thumbnail.src}
                      alt={thumbnail.alt}
                      className="course-thumbnail"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-3 p-sm-4 d-flex flex-column flex-grow-1">
                    {/* Status Row */}
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
                        Enrolled
                      </span>
                      <div className="small text-muted d-flex align-items-center gap-1">
                        <ClockIcon size={14} />
                        <span>{course.duration || 'Self-paced'}</span>
                      </div>
                    </div>

                    {/* Course Title */}
                    <h3 className="course-title-text text-break-word">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="course-desc-text line-clamp-2 text-break-word flex-grow-1">
                      {course.description}
                    </p>

                    {/* Instructor & Enrolled Date */}
                    <div className="d-flex align-items-center justify-content-between pt-2 pb-3 mb-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: '65%' }}>
                        <span className="avatar-initials">
                          {getInitials(course.instructor)}
                        </span>
                        <span className="small text-truncate text-secondary fw-medium">
                          {course.instructor}
                        </span>
                      </div>
                      <div className="small text-muted text-nowrap">
                        Joined: {formatDate(enrolledAt)}
                      </div>
                    </div>

                    {/* Continue Action */}
                    <div className="pt-2 border-top mt-auto" style={{ borderColor: 'var(--border-color)' }}>
                      <button
                        type="button"
                        className="btn btn-accent btn-sm w-100"
                        onClick={() => setLearningCourseModal({ course, enrolledAt })}
                      >
                        Continue Course
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Continue Learning Preview Modal */}
      {learningCourseModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(31, 41, 55, 0.6)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg mx-2 mx-sm-auto">
            <div className="modal-content">
              <div className="modal-header d-flex justify-content-between align-items-start">
                <div>
                  <span className="course-category-tag mb-1 d-inline-block">
                    {learningCourseModal.course.category}
                  </span>
                  <h4 className="modal-title fw-bold text-slate-900 mb-0">
                    {learningCourseModal.course.title}
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn btn-link p-1 text-muted"
                  onClick={() => setLearningCourseModal(null)}
                  aria-label="Close"
                >
                  <CloseIcon size={20} />
                </button>
              </div>

              <div className="modal-body p-3 p-sm-4">
                <div className="alert alert-success mb-4">
                  Enrolled on <strong>{formatDate(learningCourseModal.enrolledAt)}</strong>. All modules and learning materials are unlocked for your student account.
                </div>

                <h5 className="h6 text-uppercase fw-bold text-slate-900 mb-3" style={{ letterSpacing: '0.05em' }}>
                  Curriculum Modules
                </h5>
                <div className="list-group mb-4">
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="d-block text-slate-900">Module 1: Orientation & Foundations</strong>
                      <small className="text-muted">Environment setup, toolchain configuration, and fundamentals</small>
                    </div>
                    <span className="badge bg-success">Active</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="d-block text-slate-900">Module 2: Practical Implementation</strong>
                      <small className="text-muted">Guided walkthroughs, coding exercises, and pattern design</small>
                    </div>
                    <span className="badge bg-primary">In Progress</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="d-block text-slate-900">Module 3: Advanced Architecture & Production</strong>
                      <small className="text-muted">Security standards, integration testing, and deployment</small>
                    </div>
                    <span className="badge bg-light text-secondary border">Upcoming</span>
                  </div>
                </div>

                <div className="p-3 rounded bg-light border text-muted small">
                  <strong>Instructor: </strong> {learningCourseModal.course.instructor} • Discussion forums and office hours available via your student portal.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-neutral btn-sm"
                  onClick={() => setLearningCourseModal(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyCourses;
