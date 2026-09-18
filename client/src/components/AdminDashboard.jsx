import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function AdminDashboard({ token, user, onRequireLogin }) {
  // Active Admin Sub-tab: 'courses' | 'students'
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
          category: addForm.category.trim() || 'General',
          duration: addForm.duration.trim() || 'Self-paced',
          fee: Number(addForm.fee) || 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add course');
      }

      showAlert(`Course "${data.course?.title || addForm.title}" created successfully!`, 'success');
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
    setEditErrors({});
    setEditForm({
      title: course.title || '',
      description: course.description || '',
      instructor: course.instructor || '',
      category: course.category || '',
      duration: course.duration || 'Self-paced',
      fee: course.fee !== undefined ? course.fee : 0,
    });
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
          category: editForm.category.trim() || 'General',
          duration: editForm.duration.trim() || 'Self-paced',
          fee: Number(editForm.fee) || 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update course');
      }

      showAlert(`Course "${editForm.title}" updated successfully!`, 'success');
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
      showAlert(`Course "${deletingCourse.title}" deleted successfully${cascadeNote}!`, 'success');
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


  // Guard: if user is not admin
  if (!token || user?.role !== 'admin') {
    return (
      <div className="row justify-content-center my-5">
        <div className="col-12 col-md-8 col-lg-6 text-center">
          <div className="foundation-card p-5 border border-danger">
            <div className="display-4 text-danger mb-3">🛡️</div>
            <h2 className="h4 text-white fw-bold mb-3">Administrator Access Required</h2>
            <p className="text-secondary mb-4">
              This section is restricted to system administrators. Please sign in with an authorized
              admin account to access course management and student records.
            </p>
            <button
              type="button"
              className="btn btn-outline-danger px-4"
              onClick={onRequireLogin}
            >
              Sign In with Admin Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Top Banner */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 fw-bold text-white mb-0">Admin Control Center</h1>
            <span className="badge bg-danger text-uppercase px-2 py-1">Administrator</span>
          </div>
          <p className="text-secondary mb-0 small">
            Manage courses catalog, create & update offerings, and monitor registered students.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            id="admin-add-course-btn"
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <span>➕</span> Add New Course
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center justify-content-between shadow-sm`}
          role="alert"
        >
          <div>
            <strong>{alert.type === 'success' ? '✓ Success: ' : '⚠ Notice: '}</strong>
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

      {/* Overview Stats Counters */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="foundation-card p-3 border-start border-primary border-4 h-100">
            <small className="text-secondary text-uppercase fw-semibold d-block mb-1">Total Courses</small>
            <div className="h3 text-white fw-bold mb-0">{loadingCourses ? '...' : courses.length}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="foundation-card p-3 border-start border-info border-4 h-100">
            <small className="text-secondary text-uppercase fw-semibold d-block mb-1">Registered Students</small>
            <div className="h3 text-white fw-bold mb-0">{loadingStudents ? '...' : students.length}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="foundation-card p-3 border-start border-success border-4 h-100">
            <small className="text-secondary text-uppercase fw-semibold d-block mb-1">Admin Session</small>
            <div className="h6 text-success fw-bold mb-0 text-truncate">{user?.name || user?.email}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="foundation-card p-3 border-start border-warning border-4 h-100">
            <small className="text-secondary text-uppercase fw-semibold d-block mb-1">Security Level</small>
            <div className="h6 text-warning fw-bold mb-0">Role: admin (Verified)</div>
          </div>
        </div>
      </div>

      {/* Navigation Pills between Courses & Students */}
      <ul className="nav nav-pills mb-4 gap-2 border-bottom border-secondary pb-3">
        <li className="nav-item">
          <button
            type="button"
            id="admin-tab-courses"
            className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('courses')}
          >
            📚 Manage Courses ({courses.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            id="admin-tab-students"
            className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('students')}
          >
            👥 View Registered Students ({students.length})
          </button>
        </li>
      </ul>

      {/* TAB 1: MANAGE COURSES */}
      {activeTab === 'courses' && (
        <div className="foundation-card p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
            <div>
              <h2 className="h5 text-white fw-bold mb-1">Courses Catalog Management</h2>
              <p className="text-secondary small mb-0">
                Manage, edit, or delete existing course offerings.
              </p>
            </div>

            <div className="d-flex gap-2">
              <input
                type="text"
                id="admin-course-search"
                className="form-control form-control-sm bg-dark text-light border-secondary"
                placeholder="Filter courses by title, instructor..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                style={{ minWidth: '220px' }}
              />
              {courseSearch && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setCourseSearch('')}
                  title="Clear filter"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={fetchCourses}
                disabled={loadingCourses}
              >
                {loadingCourses ? '...' : '🔄 Refresh'}
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
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading courses...</span>
              </div>
              <p className="text-secondary mt-2 small">Loading course catalog...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-secondary mb-3">
                {courseSearch
                  ? `No courses match your filter "${courseSearch}".`
                  : 'No courses exist in the system yet.'}
              </p>
              {courseSearch ? (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setCourseSearch('')}
                >
                  Clear Filter
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddModal(true)}
                >
                  ➕ Create the First Course
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0" id="admin-courses-table">
                <thead>
                  <tr className="border-secondary text-secondary small text-uppercase">
                    <th scope="col" style={{ width: '28%' }}>Course Title & Category</th>
                    <th scope="col" style={{ width: '18%' }}>Instructor</th>
                    <th scope="col" style={{ width: '14%' }}>Duration</th>
                    <th scope="col" style={{ width: '12%' }}>Fee</th>
                    <th scope="col" style={{ width: '28%' }} className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course._id} className="border-secondary">

                      <td>
                        <div className="fw-bold text-white mb-1">{course.title}</div>
                        <span className="badge bg-secondary text-light small me-2">
                          {course.category}
                        </span>
                        <small className="text-muted d-block text-truncate mt-1" style={{ maxWidth: '340px' }}>
                          {course.description}
                        </small>
                      </td>
                      <td>
                        <span className="text-light">{course.instructor}</span>
                      </td>
                      <td>
                        <span className="badge bg-black bg-opacity-50 border border-secondary text-info">
                          ⏱ {course.duration || 'Self-paced'}
                        </span>
                      </td>
                      <td>
                        <span className="fw-semibold text-success">
                          {course.fee > 0 ? `$${course.fee}` : 'Free'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            id={`edit-course-${course._id}`}
                            className="btn btn-outline-info"
                            onClick={() => openEditModal(course)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            id={`delete-course-${course._id}`}
                            className="btn btn-outline-danger"
                            onClick={() => openDeleteModal(course)}
                          >
                            🗑️ Delete
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
        <div className="foundation-card p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
            <div>
              <h2 className="h5 text-white fw-bold mb-1">Registered Students Directory</h2>
              <p className="text-secondary small mb-0">
                Live list of students registered in the system (<code className="text-info">GET /students</code>). Passwords strictly excluded.
              </p>
            </div>

            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control form-control-sm bg-dark text-light border-secondary"
                placeholder="Search students by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ minWidth: '240px' }}
              />
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={fetchStudents}
                disabled={loadingStudents}
              >
                🔄 Refresh
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
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Loading students...</span>
              </div>
              <p className="text-secondary mt-2 small">Loading registered students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-secondary mb-0">
                {studentSearch ? 'No registered students match your search filter.' : 'No registered students found in database.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0" id="admin-students-table">
                <thead>
                  <tr className="border-secondary text-secondary small text-uppercase">
                    <th scope="col" style={{ width: '8%' }}>#</th>
                    <th scope="col" style={{ width: '32%' }}>Student Name</th>
                    <th scope="col" style={{ width: '35%' }}>Email Address</th>
                    <th scope="col" style={{ width: '10%' }}>Role</th>
                    <th scope="col" style={{ width: '15%' }} className="text-end">Registered Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => (
                    <tr key={student._id || idx} className="border-secondary">
                      <td className="text-secondary">{idx + 1}</td>
                      <td>
                        <strong className="text-white">{student.name}</strong>
                      </td>
                      <td>
                        <span className="text-info">{student.email}</span>
                      </td>
                      <td>
                        <span className="badge bg-primary text-uppercase">{student.role || 'student'}</span>
                      </td>
                      <td className="text-end text-secondary small">
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
      {/* MODAL: ADD COURSE */}
      {/* ========================================================= */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-dark text-white border border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">➕ Add New Course</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddSubmit} noValidate>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="add-title" className="form-label text-secondary small">
                      Course Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="add-title"
                      className={`form-control bg-black bg-opacity-25 text-white border-secondary ${addErrors.title ? 'is-invalid' : ''}`}
                      placeholder="e.g., Full Stack Web Development with React and Node"
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
                    <label htmlFor="add-description" className="form-label text-secondary small">
                      Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="add-description"
                      rows="3"
                      className={`form-control bg-black bg-opacity-25 text-white border-secondary ${addErrors.description ? 'is-invalid' : ''}`}
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
                    <div className="col-md-6">
                      <label htmlFor="add-instructor" className="form-label text-secondary small">
                        Instructor Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="add-instructor"
                        className={`form-control bg-black bg-opacity-25 text-white border-secondary ${addErrors.instructor ? 'is-invalid' : ''}`}
                        placeholder="e.g., Dr. Jane Doe"
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
                    <div className="col-md-6">
                      <label htmlFor="add-category" className="form-label text-secondary small">
                        Category
                      </label>
                      <input
                        type="text"
                        id="add-category"
                        className="form-control bg-black bg-opacity-25 text-white border-secondary"
                        placeholder="e.g., Computer Science, Data, Cloud"
                        value={addForm.category}
                        onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="add-duration" className="form-label text-secondary small">
                        Duration
                      </label>
                      <input
                        type="text"
                        id="add-duration"
                        className="form-control bg-black bg-opacity-25 text-white border-secondary"
                        placeholder="e.g., 6 Weeks, Self-paced"
                        value={addForm.duration}
                        onChange={(e) => setAddForm({ ...addForm, duration: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="add-fee" className="form-label text-secondary small">
                        Course Fee ($)
                      </label>
                      <input
                        type="number"
                        id="add-fee"
                        min="0"
                        step="1"
                        className={`form-control bg-black bg-opacity-25 text-white border-secondary ${addErrors.fee ? 'is-invalid' : ''}`}
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
                <div className="modal-footer border-secondary">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => { setShowAddModal(false); setAddErrors({}); }}
                    disabled={submittingAdd}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-add-course-btn"
                    className="btn btn-primary"
                    disabled={submittingAdd}
                  >
                    {submittingAdd ? 'Creating Course...' : 'Create Course'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT COURSE */}
      {/* ========================================================= */}
      {editingCourse && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-dark text-white border border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">✏️ Edit Course</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setEditingCourse(null)}
                ></button>
              </div>
              <form onSubmit={handleEditSubmit} noValidate>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="edit-title" className="form-label text-secondary small">
                      Course Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-title"
                      className={`form-control bg-black bg-opacity-25 text-white border-secondary ${editErrors.title ? 'is-invalid' : ''}`}
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
                    <label htmlFor="edit-description" className="form-label text-secondary small">
                      Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="edit-description"
                      rows="3"
                      className={`form-control bg-black bg-opacity-25 text-white border-secondary ${editErrors.description ? 'is-invalid' : ''}`}
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
                    <div className="col-md-6">
                      <label htmlFor="edit-instructor" className="form-label text-secondary small">
                        Instructor Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="edit-instructor"
                        className={`form-control bg-black bg-opacity-25 text-white border-secondary ${editErrors.instructor ? 'is-invalid' : ''}`}
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
                    <div className="col-md-6">
                      <label htmlFor="edit-category" className="form-label text-secondary small">
                        Category
                      </label>
                      <input
                        type="text"
                        id="edit-category"
                        className="form-control bg-black bg-opacity-25 text-white border-secondary"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="edit-duration" className="form-label text-secondary small">
                        Duration
                      </label>
                      <input
                        type="text"
                        id="edit-duration"
                        className="form-control bg-black bg-opacity-25 text-white border-secondary"
                        value={editForm.duration}
                        onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="edit-fee" className="form-label text-secondary small">
                        Course Fee ($)
                      </label>
                      <input
                        type="number"
                        id="edit-fee"
                        min="0"
                        step="1"
                        className={`form-control bg-black bg-opacity-25 text-white border-secondary ${editErrors.fee ? 'is-invalid' : ''}`}
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
                <div className="modal-footer border-secondary">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => { setEditingCourse(null); setEditErrors({}); }}
                    disabled={submittingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-edit-course-btn"
                    className="btn btn-primary"
                    disabled={submittingEdit}
                  >
                    {submittingEdit ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================= */}
      {deletingCourse && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-danger">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold text-danger">⚠️ Confirm Course Deletion</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setDeletingCourse(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-2">
                  Are you sure you want to permanently delete:
                </p>
                <div className="p-3 bg-black bg-opacity-50 border border-secondary rounded mb-3">
                  <strong className="text-white d-block">{deletingCourse.title}</strong>
                  <small className="text-secondary">Instructor: {deletingCourse.instructor}</small>
                </div>
                <div className="alert alert-warning py-2 mb-0 small">
                  <strong>Notice:</strong> Deleting this course will also cascade delete all associated
                  student enrollments from their dashboards.
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setDeletingCourse(null)}
                  disabled={submittingDelete}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-delete-course-btn"
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={submittingDelete}
                >
                  {submittingDelete ? 'Deleting...' : 'Confirm Delete'}
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
