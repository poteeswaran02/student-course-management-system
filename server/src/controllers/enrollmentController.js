const mongoose = require('mongoose');
const { Course, Enrollment } = require('../models');

/**
 * @route   POST /enroll (or /api/enroll)
 * @desc    Enroll authenticated student in a course
 * @access  Private (Requires JWT)
 */
const enrollCourse = async (req, res, next) => {
  try {
    // Authenticated user identity comes strictly from JWT middleware
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to enroll.',
      });
    }

    const { courseId } = req.body;

    // 1. Validate courseId presence
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId.',
      });
    }

    // 2. Validate courseId format (must be valid MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format.',
      });
    }

    // 3. Verify that the course exists in the database
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // 4. Check for duplicate enrollment (user + course)
    const existingEnrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId: course._id,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'You are already enrolled in this course.',
      });
    }

    // 5. Create new enrollment
    const newEnrollment = await Enrollment.create({
      userId: req.user._id,
      courseId: course._id,
      enrolledAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: `Enrolled in "${course.title}" successfully.`,
      enrollment: {
        id: newEnrollment._id,
        userId: newEnrollment.userId,
        courseId: newEnrollment.courseId,
        enrolledAt: newEnrollment.enrolledAt,
        courseTitle: course.title,
      },
    });
  } catch (error) {
    // Handle potential duplicate compound index race condition (MongoDB error 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You are already enrolled in this course.',
      });
    }
    next(error);
  }
};

/**
 * @route   GET /mycourses (or /api/mycourses)
 * @desc    Get enrolled courses for the authenticated student
 * @access  Private (Requires JWT)
 */
const getMyCourses = async (req, res, next) => {
  try {
    // Authenticated user identity comes strictly from verified JWT
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to view your courses.',
      });
    }

    // Strict user isolation: user ID is bound to req.user._id only
    const enrollments = await Enrollment.find({ userId: req.user._id })
      .populate('courseId')
      .sort({ enrolledAt: -1 });

    // Format clean response, handling any edge case where course might be unpopulated
    const myCourses = enrollments
      .filter((enrollment) => enrollment.courseId != null)
      .map((enrollment) => ({
        enrollmentId: enrollment._id,
        enrolledAt: enrollment.enrolledAt,
        course: {
          id: enrollment.courseId._id,
          title: enrollment.courseId.title,
          description: enrollment.courseId.description,
          instructor: enrollment.courseId.instructor,
          category: enrollment.courseId.category,
          duration: enrollment.courseId.duration,
          fee: enrollment.courseId.fee !== undefined ? enrollment.courseId.fee : 0,
        },
      }));


    return res.status(200).json({
      success: true,
      count: myCourses.length,
      myCourses,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enrollCourse,
  getMyCourses,
};
