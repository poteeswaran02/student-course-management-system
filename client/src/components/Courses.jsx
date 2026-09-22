import React, { useState, useEffect, useRef } from 'react';
import { getCourseThumbnail, formatPriceINR } from '../utils/courseImages';
import { SearchIcon, CloseIcon, ClockIcon, CheckIcon } from './Icons';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const CATEGORIES = [
  'All',
  'Web Development',
  'Programming',
  'Data Science',
  'Cloud Computing',
  'Software Engineering'
];

function Courses({ token, onRequireLogin }) {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrollFeedback, setEnrollFeedback] = useState(null);
  const [selectedCourseModal, setSelectedCourseModal] = useState(null);
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

  useEffect(() => {
    fetchCourses('');
  }, []);

  // Handle search with 350ms debounce
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

  // Filter courses by category
  const filteredCourses = courses.filter((course) => {
    if (selectedCategory === 'All') return true;
    const cat = (course.category || '').toLowerCase();
    const target = selectedCategory.toLowerCase();
    return cat.includes(target) || target.includes(cat);
  });

  // Handle enrollment
  const handleEnroll = async (course) => {
    setEnrollFeedback(null);

    if (!token) {
      if (onRequireLogin) onRequireLogin();
      setEnrollFeedback({
        type: 'warning',
        message: 'Please sign in or register an account to enroll in courses.',
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
          message: `Successfully enrolled in "${course.title}".`,
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

  const getInitials = (name) => {
    if (!name) return 'ED';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('courses-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: Clean, Natural Education Header                           */}
      {/* ========================================================================= */}
      <section className="hero-education text-center">
        <div className="container-xl px-3 px-md-4">
          <span className="hero-tag">LEARN • GROW • SUCCEED</span>
          <h1 className="hero-heading">
            Learn Skills That Build Your Future
          </h1>
          <p className="hero-subtext mx-auto" style={{ maxWidth: '640px' }}>
            Explore practical courses and develop skills for your career. Study industry-relevant topics at your own pace with structured curriculum.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <button
              type="button"
              className="btn btn-accent px-4 py-2"
              onClick={scrollToCatalog}
            >
              Explore Courses
            </button>
            {!token && (
              <button
                type="button"
                className="btn btn-neutral px-4 py-2"
                onClick={() => onRequireLogin && onRequireLogin()}
              >
                Sign In
              </button>
            )}
          </div>

          <div className="d-flex flex-wrap justify-content-center align-items-center gap-4 mt-4 pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
            <div className="d-flex align-items-center gap-1 small text-muted">
              <span className="text-success"><CheckIcon size={16} /></span>
              <span>Self-Paced Learning</span>
            </div>
            <div className="d-flex align-items-center gap-1 small text-muted">
              <span className="text-success"><CheckIcon size={16} /></span>
              <span>Expert Instructors</span>
            </div>
            <div className="d-flex align-items-center gap-1 small text-muted">
              <span className="text-success"><CheckIcon size={16} /></span>
              <span>Project-Based Curriculum</span>
            </div>
            <div className="d-flex align-items-center gap-1 small text-muted">
              <span className="text-success"><CheckIcon size={16} /></span>
              <span>Instant Course Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Container */}
      <div className="container-xl px-3 px-md-4 py-4" id="courses-catalog">
        {/* Global Enrollment Feedback Alert */}
        {enrollFeedback && (
          <div
            id="enroll-feedback-alert"
            className={`alert alert-${enrollFeedback.type} alert-dismissible fade show mb-4`}
            role="alert"
          >
            <strong>
              {enrollFeedback.type === 'success'
                ? 'Enrollment Confirmed: '
                : enrollFeedback.type === 'info'
                ? 'Notice: '
                : 'Notice: '}
            </strong>
            {enrollFeedback.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setEnrollFeedback(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Section Heading */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3">
          <div>
            <h2 className="h4 fw-bold text-slate-900 mb-1">Featured Courses</h2>
            <p className="text-secondary small mb-0">
              Explore our most popular courses and start learning today.
            </p>
          </div>
          <span className="badge bg-white text-secondary border px-3 py-2 small">
            {filteredCourses.length} {filteredCourses.length === 1 ? 'Course' : 'Courses'} Available
          </span>
        </div>

        {/* Category Filter Pills & Search */}
        <div className="foundation-card p-3 mb-4">
          <div className="d-flex flex-wrap gap-2 mb-3">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={`filter-pill ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="row g-2">
            <div className="col-12 col-md-7 col-lg-5">
              <div className="search-input-box">
                <span className="text-muted me-2"><SearchIcon size={16} /></span>
                <input
                  type="text"
                  id="course-search-input"
                  className="search-field"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button
                    type="button"
                    id="clear-search-btn"
                    className="btn btn-link p-0 text-muted"
                    onClick={handleClearSearch}
                    title="Clear search"
                  >
                    <CloseIcon size={16} />
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="form-text text-muted small mt-1">
                  Filtering for: <em>"{searchTerm}"</em>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4" role="alert">
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
            <div className="spinner-border text-secondary" role="status"></div>
            <p className="text-muted mt-3 small">Loading available course offerings...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCourses.length === 0 && (
          <div className="foundation-card text-center py-5 px-3 px-sm-4 my-3">
            <h3 className="h5 fw-bold mb-2">
              {searchTerm || selectedCategory !== 'All' ? 'No Matching Courses Found' : 'No Courses Available Yet'}
            </h3>
            <p className="text-secondary small max-w-md mx-auto mb-4" style={{ maxWidth: '440px' }}>
              {searchTerm || selectedCategory !== 'All'
                ? `We couldn't find any courses matching your filter criteria. Try searching for different keywords or clear filters.`
                : 'The course catalog is currently being updated. Please check back soon.'}
            </p>
            {(searchTerm || selectedCategory !== 'All') && (
              <button
                type="button"
                id="reset-search-btn"
                className="btn btn-accent btn-sm px-4"
                onClick={() => {
                  handleClearSearch();
                  setSelectedCategory('All');
                }}
              >
                Reset Search Filters
              </button>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. COURSE CARDS GRID: Real Photos, 3-col Desktop, 2-col Tablet, 1-col Mobile*/}
        {/* ========================================================================= */}
        {!loading && !error && filteredCourses.length > 0 && (
          <div className="row g-3 g-md-4" id="course-list-container">
            {filteredCourses.map((course) => {
              const thumbnail = getCourseThumbnail(course);
              return (
                <div key={course._id} className="col-12 col-md-6 col-lg-4">
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

                    {/* Card Content Body */}
                    <div className="p-3 p-sm-4 d-flex flex-column flex-grow-1">
                      {/* Category */}
                      <div className="course-category-tag">
                        {course.category}
                      </div>

                      {/* Title */}
                      <h3 className="course-title-text text-break-word">
                        {course.title}
                      </h3>

                      {/* Description */}
                      <p className="course-desc-text line-clamp-2 text-break-word flex-grow-1">
                        {course.description}
                      </p>

                      {/* Metadata Row: Instructor & Duration */}
                      <div className="d-flex align-items-center justify-content-between pt-2 pb-3 mb-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: '65%' }}>
                          <span className="avatar-initials">
                            {getInitials(course.instructor)}
                          </span>
                          <span className="small text-truncate text-secondary fw-medium">
                            {course.instructor}
                          </span>
                        </div>
                        <div className="small text-muted d-flex align-items-center gap-1 text-nowrap">
                          <ClockIcon size={14} />
                          <span>{course.duration || 'Self-paced'}</span>
                        </div>
                      </div>

                      {/* Pricing & Actions */}
                      <div className="d-flex align-items-center justify-content-between gap-2 pt-2 border-top mt-auto" style={{ borderColor: 'var(--border-color)' }}>
                        <div>
                          <span className="d-block text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fee</span>
                          <span className={course.fee > 0 ? 'price-text' : 'price-text price-free'}>
                            {formatPriceINR(course.fee)}
                          </span>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-neutral btn-sm"
                            onClick={() => setSelectedCourseModal(course)}
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            id={`enroll-btn-${course._id}`}
                            className="btn btn-accent btn-sm px-3"
                            onClick={() => handleEnroll(course)}
                            disabled={enrollingId === course._id}
                          >
                            {enrollingId === course._id ? 'Enrolling...' : 'Enroll Now'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. COURSE DETAILS PREVIEW MODAL                                           */}
        {/* ========================================================================= */}
        {selectedCourseModal && (
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
                    <span className="course-category-tag d-inline-block mb-1">
                      {selectedCourseModal.category}
                    </span>
                    <h4 className="modal-title fw-bold text-slate-900 mb-0">
                      {selectedCourseModal.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link p-1 text-muted"
                    onClick={() => setSelectedCourseModal(null)}
                    aria-label="Close"
                  >
                    <CloseIcon size={20} />
                  </button>
                </div>

                <div className="modal-body p-3 p-sm-4">
                  {/* Thumbnail Banner */}
                  <div className="rounded overflow-hidden mb-3" style={{ maxHeight: '200px' }}>
                    <img
                      src={getCourseThumbnail(selectedCourseModal).src}
                      alt={selectedCourseModal.title}
                      className="w-100 h-100 object-fit-cover"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>

                  {/* Metadata Row */}
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 rounded bg-light border mb-4">
                    <div className="d-flex align-items-center gap-2">
                      <span className="avatar-initials" style={{ width: '36px', height: '36px' }}>
                        {getInitials(selectedCourseModal.instructor)}
                      </span>
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Course Instructor</small>
                        <strong className="text-slate-900">{selectedCourseModal.instructor}</strong>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-4">
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Duration</small>
                        <strong className="text-slate-900">{selectedCourseModal.duration || 'Self-paced'}</strong>
                      </div>
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Course Fee</small>
                        <strong className={selectedCourseModal.fee > 0 ? 'text-slate-900' : 'text-success'}>
                          {formatPriceINR(selectedCourseModal.fee)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Course Overview */}
                  <div className="mb-4">
                    <h5 className="h6 text-uppercase fw-bold text-slate-900 mb-2" style={{ letterSpacing: '0.05em' }}>
                      Course Overview
                    </h5>
                    <p className="text-secondary small lh-lg mb-0 text-break-word">
                      {selectedCourseModal.description}
                    </p>
                  </div>

                  {/* Syllabus / Highlights */}
                  <div className="mb-2">
                    <h5 className="h6 text-uppercase fw-bold text-slate-900 mb-2" style={{ letterSpacing: '0.05em' }}>
                      Key Learning Highlights
                    </h5>
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <div className="p-2 rounded bg-light border d-flex align-items-start gap-2">
                          <span className="text-success"><CheckIcon size={16} /></span>
                          <span className="small text-secondary">Core industry fundamentals and conceptual architecture</span>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="p-2 rounded bg-light border d-flex align-items-start gap-2">
                          <span className="text-success"><CheckIcon size={16} /></span>
                          <span className="small text-secondary">Hands-on exercises and real-world project builds</span>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="p-2 rounded bg-light border d-flex align-items-start gap-2">
                          <span className="text-success"><CheckIcon size={16} /></span>
                          <span className="small text-secondary">Industry standard best practices and debugging techniques</span>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="p-2 rounded bg-light border d-flex align-items-start gap-2">
                          <span className="text-success"><CheckIcon size={16} /></span>
                          <span className="small text-secondary">Verified course completion status on student dashboard</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-neutral btn-sm"
                    onClick={() => setSelectedCourseModal(null)}
                  >
                    Close Preview
                  </button>
                  <button
                    type="button"
                    className="btn btn-accent btn-sm px-4"
                    onClick={() => {
                      const course = selectedCourseModal;
                      setSelectedCourseModal(null);
                      handleEnroll(course);
                    }}
                    disabled={enrollingId === selectedCourseModal._id}
                  >
                    {enrollingId === selectedCourseModal._id ? 'Enrolling...' : 'Enroll in Course'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Courses;
