const express = require('express');
const {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Public Course Browsing and Search Route
 * GET /courses or GET /courses?search=term
 */
router.get('/', getCourses);

/**
 * Admin Course Management Routes
 */
// POST /courses - Add new course (Admin only)
router.post('/', protect, authorizeRoles('admin'), createCourse);

// PUT /courses/:id or PUT /course/:id - Update course (Admin only)
router.put('/:id', protect, authorizeRoles('admin'), updateCourse);

// DELETE /courses/:id or DELETE /course/:id - Delete course and cascade enrollments (Admin only)
router.delete('/:id', protect, authorizeRoles('admin'), deleteCourse);

module.exports = router;

