const express = require('express');
const { enrollCourse, getMyCourses } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Protected Course Enrollment Routes
 * POST /enroll
 * GET /mycourses
 */
router.post('/enroll', protect, enrollCourse);
router.get('/mycourses', protect, getMyCourses);

module.exports = router;
