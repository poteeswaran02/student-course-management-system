import React, { useState, useEffect, useCallback } from 'react';
import { formatPriceINR } from '../utils/courseImages';
import { PlusIcon, EditIcon, TrashIcon, CloseIcon } from './Icons';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

function AdminDashboard({ token, user, onRequireLogin }) {
  const [activeTab, setActiveTab] = useState('courses');

  // Courses state
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState(null);

  // Students state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentError, setStudentError] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');

  // Course Filter state
  const [courseSearch, setCourseSearch] = useState('');

  // Alerts
  const [alert, setAlert] = useState(null); // { type: 'success' | 'danger', message: '' }

  // Add Course Modal / Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    description: '',
    instructor: '',
    category: 'Computer Science',
    duration: 'Self-paced',
    fee: 0,
  });
  const [addErrors, setAddErrors] = useState({});
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit Course Modal State
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    instructor: '',
    category: '',
    duration: '',
    fee: 0,
  });
  const [editErrors, setEditErrors] = useState({});
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Confirmation Modal State
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const validateCourseInputs = (form) => {
    const errs = {};
    if (!form.title || !form.title.trim()) {
      errs.title = 'Course title is required.';
    } else if (form.title.trim().length < 3) {
      errs.title = 'Course title must be at least 3 characters.';
    }

    if (!form.description || !form.description.trim()) {
      errs.description = 'Course description is required.';
    } else if (form.description.trim().length < 10) {
      errs.description = 'Course description must be at least 10 characters.';
    }

    if (!form.instructor || !form.instructor.trim()) {
      errs.instructor = 'Instructor name is required.';
    } else if (form.instructor.trim().length < 2) {
      errs.instructor = 'Instructor name must be at least 2 characters.';
    }

    if (form.fee !== undefined && form.fee !== '') {
      const num = Number(form.fee);
      if (isNaN(num) || num < 0) {
        errs.fee = 'Fee must be a non-negative number (0 for Free).';
      }
    }

    return errs;
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dismissAlert = () => setAlert(null);

  // Fetch Courses
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    setCourseError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/courses`);
      if (!response.ok) {
        throw new Error(`Failed to load courses (HTTP ${response.status})`);
      }
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setCourseError(err.message || 'Unable to fetch courses');
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  // Fetch Registered Students
  const fetchStudents = useCallback(async () => {
    if (!token) return;
    setLoadingStudents(true);
    setStudentError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401 || response.status === 403) {
        throw new Error('Access denied. Administrator privileges required.');
      }
      if (!response.ok) {
        throw new Error(`Failed to load students (HTTP ${response.status})`);
      }
      const data = await response.json();
      setStudents(data.students || []);
    } catch (err) {
      setStudentError(err.message || 'Unable to fetch students');
    } finally {
      setLoadingStudents(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, [fetchCourses, fetchStudents]);

  // Handle Add Course
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = validateCourseInputs(addForm);
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }
    setAddErrors({});

    setSubmittingAdd(true);
    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: addForm.title.trim(),
          description: addForm.description.trim(),
          instructor: addForm.instructor.trim(),
          category: addForm.category.trim() || 'Computer Science',
          duration: addForm.duration.trim() || 'Self-paced',
          fee: Number(addForm.fee) || 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create course');
      }

      showAlert(`Course "${data.course?.title || addForm.title}" created successfully.`, 'success');
      setShowAddModal(false);
      setAddForm({
        title: '',
        description: '',
        instructor: '',
        category: 'Computer Science',
        duration: 'Self-paced',
        fee: 0,
      });
      fetchCourses();
    } catch (err) {
      showAlert(err.message || 'Error creating course', 'danger');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (course) => {
    setEditingCourse(course);
    setEditForm({
      title: course.title || '',
      description: course.description || '',
      instructor: course.instructor || '',
      category: course.category || 'Computer Science',
      duration: course.duration || 'Self-paced',
      fee: course.fee || 0,
    });
    setEditErrors({});
  };

  // Handle Edit Course
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    const errors = validateCourseInputs(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    setEditErrors({});

    setSubmittingEdit(true);
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${editingCourse._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          instructor: editForm.instructor.trim(),
          category: editForm.category.trim(),
          duration: editForm.duration.trim(),
          fee: Number(editForm.fee),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update course');
      }

      showAlert(`Course "${editForm.title}" updated successfully.`, 'success');
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      showAlert(err.message || 'Error updating course', 'danger');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (course) => {
    setDeletingCourse(course);
  };

  // Handle Delete Course
  const handleDeleteConfirm = async () => {
    if (!deletingCourse) return;

    setSubmittingDelete(true);
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${deletingCourse._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete course');
      }

      const cascadeNote = data.deletedEnrollmentsCount
        ? ` (and cleaned up ${data.deletedEnrollmentsCount} student enrollment${data.deletedEnrollmentsCount > 1 ? 's' : ''})`
        : '';
      showAlert(`Course "${deletingCourse.title}" deleted successfully${cascadeNote}.`, 'success');
      setDeletingCourse(null);
      fetchCourses();
    } catch (err) {
      showAlert(err.message || 'Error deleting course', 'danger');
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (!studentSearch.trim()) return true;
    const term = studentSearch.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term))
    );
  });

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    if (!courseSearch.trim()) return true;
    const term = courseSearch.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(term)) ||
      (c.description && c.description.toLowerCase().includes(term)) ||
      (c.instructor && c.instructor.toLowerCase().includes(term)) ||
      (c.category && c.category.toLowerCase().includes(term))
    );
  });

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  // Guard: if user is not admin
  if (!token || user?.role !== 'admin') {
    return (
      <div className="row justify-content-center my-5">
        <div className="col-12 col-md-8 col-lg-6 text-center">
          <div className="foundation-card p-5 border">
            <h2 className="h4 fw-bold mb-3 text-slate-900">Administrator Access Required</h2>
            <p className="text-secondary mb-4 small">
              This section is restricted to system administrators. Please sign in with an authorized
              administrator account to access course management and student records.
            </p>
            <button
              type="button"
              className="btn btn-outline-danger px-4"
              onClick={onRequireLogin}
            >
              Sign In as Administrator
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Top Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 fw-bold text-slate-900 mb-0">Course Administration</h1>
            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1" style={{ fontSize: '0.7rem' }}>
              Administrator
            </span>
          </div>
          <p className="text-secondary mb-0 small">
            Manage course catalog, update curriculum offerings, and monitor student registrations.
          </p>
        </div>

        <div>
          <button
            type="button"
            id="admin-add-course-btn"
            className="btn btn-accent d-flex align-items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <PlusIcon size={16} />
            <span>Add New Course</span>
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center justify-content-between gap-2`}
          role="alert"
        >
          <div>
            <strong>{alert.type === 'success' ? 'Success: ' : 'Notice: '}</strong>
            {alert.message}
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={dismissAlert}
          ></button>
        </div>
      )}

      {/* Stats Counters */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="foundation-card p-3 h-100">
            <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Total Courses</span>
            <div className="h3 text-slate-900 fw-bold mb-0">{loadingCourses ? '...' : courses.length}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="foundation-card p-3 h-100">
            <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Registered Students</span>
            <div className="h3 text-slate-900 fw-bold mb-0">{loadingStudents ? '...' : students.length}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="foundation-card p-3 h-100">
            <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Active Session</span>
            <div className="h6 text-slate-900 fw-bold mb-0 text-truncate">{user?.name || user?.email}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="foundation-card p-3 h-100">
            <span className="text-muted small text-uppercase fw-semibold d-block mb-1">Security Level</span>
            <div className="h6 text-slate-900 fw-bold mb-0">Role: admin (Verified)</div>
          </div>
        </div>
      </div>

      {/* Navigation Switcher */}
      <div className="d-flex flex-wrap gap-2 mb-4 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
        <button
          type="button"
          id="admin-tab-courses"
          className={`btn btn-sm ${activeTab === 'courses' ? 'btn-accent' : 'btn-neutral'}`}
          onClick={() => setActiveTab('courses')}
        >
          Courses Management ({courses.length})
        </button>
        <button
          type="button"
          id="admin-tab-students"
          className={`btn btn-sm ${activeTab === 'students' ? 'btn-accent' : 'btn-neutral'}`}
          onClick={() => setActiveTab('students')}
        >
          Registered Students ({students.length})
        </button>
      </div>

      {/* TAB 1: MANAGE COURSES */}
      {activeTab === 'courses' && (
        <div className="foundation-card p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
            <div>
              <h2 className="h5 fw-bold text-slate-900 mb-1">Course Catalog Directory</h2>
              <p className="text-secondary small mb-0">
                View, modify details, or remove courses from the database.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2 w-100 w-md-auto align-items-center">
              <input
                type="text"
                id="admin-course-search"
                className="form-control form-control-sm flex-grow-1"
                placeholder="Filter courses by title, instructor..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                style={{ minWidth: '180px' }}
              />
              {courseSearch && (
                <button
                  type="button"
                  className="btn btn-neutral btn-sm"
                  onClick={() => setCourseSearch('')}
                  title="Clear filter"
                >
                  <CloseIcon size={14} />
                </button>
              )}
              <button
                type="button"
                className="btn btn-neutral btn-sm flex-shrink-0"
                onClick={fetchCourses}
                disabled={loadingCourses}
              >
                {loadingCourses ? '...' : 'Refresh'}
              </button>
            </div>
          </div>

          {courseError && (
            <div className="alert alert-danger mb-3" role="alert">
              {courseError}
            </div>
          )}

          {loadingCourses ? (
            <div className="text-center py-5">
              <div className="spinner-border text-secondary" role="status"></div>
              <p className="text-muted mt-2 small">Loading course catalog...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-secondary mb-3 small">
                {courseSearch
                  ? `No courses match your filter "${courseSearch}".`
                  : 'No courses exist in the system yet.'}
              </p>
              {courseSearch ? (
                <button
                  type="button"
                  className="btn btn-outline-accent btn-sm"
                  onClick={() => setCourseSearch('')}
                >
                  Clear Filter
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-accent btn-sm"
                  onClick={() => setShowAddModal(true)}
                >
                  Create First Course
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-clean align-middle mb-0" id="admin-courses-table" style={{ minWidth: '650px' }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '32%' }}>Course Details</th>
                    <th scope="col" style={{ width: '22%' }}>Instructor</th>
                    <th scope="col" style={{ width: '16%' }}>Duration</th>
                    <th scope="col" style={{ width: '12%' }}>Fee (INR)</th>
                    <th scope="col" style={{ width: '18%' }} className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course._id}>
                      <td>
                        <div className="fw-bold text-slate-900 mb-1">{course.title}</div>
                        <span className="badge bg-light text-secondary border me-2 small">
                          {course.category}
                        </span>
                        <small className="text-muted d-block text-truncate mt-1" style={{ maxWidth: '320px' }}>
                          {course.description}
                        </small>
                      </td>
                      <td>
                        <span className="text-slate-900">{course.instructor}</span>
                      </td>
                      <td>
                        <span className="badge bg-white text-secondary border">
                          {course.duration || 'Self-paced'}
                        </span>
                      </td>
                      <td>
                        <span className="fw-bold text-slate-900">
                          {formatPriceINR(course.fee)}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            id={`edit-course-${course._id}`}
                            className="btn btn-neutral d-flex align-items-center gap-1"
                            onClick={() => openEditModal(course)}
                          >
                            <EditIcon size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            id={`delete-course-${course._id}`}
                            className="btn btn-outline-danger d-flex align-items-center gap-1"
                            onClick={() => openDeleteModal(course)}
                          >
                            <TrashIcon size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTERED STUDENTS */}
      {activeTab === 'students' && (
        <div className="foundation-card p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
            <div>
              <h2 className="h5 fw-bold text-slate-900 mb-1">Student Directory</h2>
              <p className="text-secondary small mb-0">
                Directory of registered students (<code className="text-muted">GET /students</code>). Passwords strictly excluded.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2 w-100 w-md-auto align-items-center">
              <input
                type="text"
                className="form-control form-control-sm flex-grow-1"
                placeholder="Search students by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ minWidth: '180px' }}
              />
              <button
                type="button"
                className="btn btn-neutral btn-sm flex-shrink-0"
                onClick={fetchStudents}
                disabled={loadingStudents}
              >
                Refresh
              </button>
            </div>
          </div>

          {studentError && (
            <div className="alert alert-danger mb-3" role="alert">
              {studentError}
            </div>
          )}

          {loadingStudents ? (
            <div className="text-center py-5">
              <div className="spinner-border text-secondary" role="status"></div>
              <p className="text-muted mt-2 small">Loading student records...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-secondary mb-0 small">
                {studentSearch ? 'No registered students match your search filter.' : 'No registered students found in database.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-clean align-middle mb-0" id="admin-students-table" style={{ minWidth: '580px' }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '8%' }}>#</th>
                    <th scope="col" style={{ width: '32%' }}>Student Name</th>
                    <th scope="col" style={{ width: '35%' }}>Email Address</th>
                    <th scope="col" style={{ width: '10%' }}>Role</th>
                    <th scope="col" style={{ width: '15%' }} className="text-end">Registered Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => (
                    <tr key={student._id || idx}>
                      <td className="text-muted small">{idx + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="avatar-initials" style={{ width: '28px', height: '28px', fontSize: '0.72rem' }}>
                            {getInitials(student.name)}
                          </span>
                          <strong className="text-slate-900">{student.name}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted">{student.email}</span>
                      </td>
                      <td>
                        <span className="badge bg-white text-secondary border text-uppercase" style={{ fontSize: '0.68rem' }}>
                          {student.role || 'student'}
                        </span>
                      </td>
                      <td className="text-end text-muted small">
                        {student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD COURSE                                         */}
      {/* ========================================================= */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(31, 41, 55, 0.6)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg mx-2 mx-sm-auto">
            <div className="modal-content">
              <div className="modal-header d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-slate-900 mb-0">Add New Course</h5>
                <button
                  type="button"
                  className="btn btn-link p-1 text-muted"
                  aria-label="Close"
                  onClick={() => setShowAddModal(false)}
                >
                  <CloseIcon size={20} />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} noValidate>
                <div className="modal-body p-3 p-sm-4">
                  <div className="mb-3">
                    <label htmlFor="add-title" className="form-label">
                      Course Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="add-title"
                      className={`form-control ${addErrors.title ? 'is-invalid' : ''}`}
                      placeholder="e.g., Full Stack Web Development"
                      value={addForm.title}
                      onChange={(e) => {
                        setAddForm({ ...addForm, title: e.target.value });
                        if (addErrors.title) setAddErrors({ ...addErrors, title: '' });
                      }}
                    />
                    {addErrors.title && (
                      <div className="invalid-feedback">{addErrors.title}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="add-description" className="form-label">
                      Course Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="add-description"
                      rows="3"
                      className={`form-control ${addErrors.description ? 'is-invalid' : ''}`}
                      placeholder="Provide a comprehensive summary of what students will learn..."
                      value={addForm.description}
                      onChange={(e) => {
                        setAddForm({ ...addForm, description: e.target.value });
                        if (addErrors.description) setAddErrors({ ...addErrors, description: '' });
                      }}
                    ></textarea>
                    {addErrors.description && (
                      <div className="invalid-feedback">{addErrors.description}</div>
                    )}
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label htmlFor="add-instructor" className="form-label">
                        Instructor Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="add-instructor"
                        className={`form-control ${addErrors.instructor ? 'is-invalid' : ''}`}
                        placeholder="e.g., Dr. Angela Yu"
                        value={addForm.instructor}
                        onChange={(e) => {
                          setAddForm({ ...addForm, instructor: e.target.value });
                          if (addErrors.instructor) setAddErrors({ ...addErrors, instructor: '' });
                        }}
                      />
                      {addErrors.instructor && (
                        <div className="invalid-feedback">{addErrors.instructor}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="add-category" className="form-label">
                        Category
                      </label>
                      <select
                        id="add-category"
                        className="form-select"
                        value={addForm.category}
                        onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                      >
                        <option value="Web Development">Web Development</option>
                        <option value="Programming">Programming</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Cloud Computing">Cloud Computing</option>
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Computer Science">Computer Science</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label htmlFor="add-duration" className="form-label">
                        Duration
                      </label>
                      <input
                        type="text"
                        id="add-duration"
                        className="form-control"
                        placeholder="e.g., 8 Weeks or Self-paced"
                        value={addForm.duration}
                        onChange={(e) => setAddForm({ ...addForm, duration: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="add-fee" className="form-label">
                        Tuition Fee (₹)
                      </label>
                      <input
                        type="number"
                        id="add-fee"
                        min="0"
                        className={`form-control ${addErrors.fee ? 'is-invalid' : ''}`}
                        placeholder="0 for Free"
                        value={addForm.fee}
                        onChange={(e) => {
                          setAddForm({ ...addForm, fee: e.target.value });
                          if (addErrors.fee) setAddErrors({ ...addErrors, fee: '' });
                        }}
                      />
                      {addErrors.fee && (
                        <div className="invalid-feedback">{addErrors.fee}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-neutral btn-sm"
                    onClick={() => setShowAddModal(false)}
                    disabled={submittingAdd}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-add-course-btn"
                    className="btn btn-accent btn-sm px-4"
                    disabled={submittingAdd}
                  >
                    {submittingAdd ? 'Creating...' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT COURSE                                        */}
      {/* ========================================================= */}
      {editingCourse && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(31, 41, 55, 0.6)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg mx-2 mx-sm-auto">
            <div className="modal-content">
              <div className="modal-header d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-slate-900 mb-0">Edit Course Offering</h5>
                <button
                  type="button"
                  className="btn btn-link p-1 text-muted"
                  aria-label="Close"
                  onClick={() => setEditingCourse(null)}
                >
                  <CloseIcon size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} noValidate>
                <div className="modal-body p-3 p-sm-4">
                  <div className="mb-3">
                    <label htmlFor="edit-title" className="form-label">
                      Course Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-title"
                      className={`form-control ${editErrors.title ? 'is-invalid' : ''}`}
                      value={editForm.title}
                      onChange={(e) => {
                        setEditForm({ ...editForm, title: e.target.value });
                        if (editErrors.title) setEditErrors({ ...editErrors, title: '' });
                      }}
                    />
                    {editErrors.title && (
                      <div className="invalid-feedback">{editErrors.title}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="edit-description" className="form-label">
                      Course Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="edit-description"
                      rows="3"
                      className={`form-control ${editErrors.description ? 'is-invalid' : ''}`}
                      value={editForm.description}
                      onChange={(e) => {
                        setEditForm({ ...editForm, description: e.target.value });
                        if (editErrors.description) setEditErrors({ ...editErrors, description: '' });
                      }}
                    ></textarea>
                    {editErrors.description && (
                      <div className="invalid-feedback">{editErrors.description}</div>
                    )}
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label htmlFor="edit-instructor" className="form-label">
                        Instructor Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="edit-instructor"
                        className={`form-control ${editErrors.instructor ? 'is-invalid' : ''}`}
                        value={editForm.instructor}
                        onChange={(e) => {
                          setEditForm({ ...editForm, instructor: e.target.value });
                          if (editErrors.instructor) setEditErrors({ ...editErrors, instructor: '' });
                        }}
                      />
                      {editErrors.instructor && (
                        <div className="invalid-feedback">{editErrors.instructor}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="edit-category" className="form-label">
                        Category
                      </label>
                      <select
                        id="edit-category"
                        className="form-select"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        <option value="Web Development">Web Development</option>
                        <option value="Programming">Programming</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Cloud Computing">Cloud Computing</option>
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Computer Science">Computer Science</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label htmlFor="edit-duration" className="form-label">
                        Duration
                      </label>
                      <input
                        type="text"
                        id="edit-duration"
                        className="form-control"
                        value={editForm.duration}
                        onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="edit-fee" className="form-label">
                        Tuition Fee (₹)
                      </label>
                      <input
                        type="number"
                        id="edit-fee"
                        min="0"
                        className={`form-control ${editErrors.fee ? 'is-invalid' : ''}`}
                        value={editForm.fee}
                        onChange={(e) => {
                          setEditForm({ ...editForm, fee: e.target.value });
                          if (editErrors.fee) setEditErrors({ ...editErrors, fee: '' });
                        }}
                      />
                      {editErrors.fee && (
                        <div className="invalid-feedback">{editErrors.fee}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-neutral btn-sm"
                    onClick={() => setEditingCourse(null)}
                    disabled={submittingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-edit-course-btn"
                    className="btn btn-accent btn-sm px-4"
                    disabled={submittingEdit}
                  >
                    {submittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE COURSE CONFIRMATION                         */}
      {/* ========================================================= */}
      {deletingCourse && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(31, 41, 55, 0.6)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered mx-2 mx-sm-auto">
            <div className="modal-content">
              <div className="modal-header d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-danger mb-0">Confirm Course Deletion</h5>
                <button
                  type="button"
                  className="btn btn-link p-1 text-muted"
                  aria-label="Close"
                  onClick={() => setDeletingCourse(null)}
                >
                  <CloseIcon size={20} />
                </button>
              </div>
              <div className="modal-body p-3 p-sm-4">
                <p className="text-secondary mb-3">
                  Are you sure you want to delete the course <strong>"{deletingCourse.title}"</strong>?
                </p>
                <div className="alert alert-warning small mb-0">
                  This action will remove the course and automatically clean up associated student enrollment records.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-neutral btn-sm"
                  onClick={() => setDeletingCourse(null)}
                  disabled={submittingDelete}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-delete-course-btn"
                  className="btn btn-danger btn-sm px-4"
                  onClick={handleDeleteConfirm}
                  disabled={submittingDelete}
                >
                  {submittingDelete ? 'Deleting...' : 'Delete Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
