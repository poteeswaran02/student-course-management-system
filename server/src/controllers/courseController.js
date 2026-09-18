const mongoose = require('mongoose');
const { Course, Enrollment } = require('../models');

/**
 * @route   GET /courses (or /api/courses)
 * @desc    Get all available courses, with optional case-insensitive search
 * @access  Public
 */
const getCourses = async (req, res, next) => {
  try {
    const { search } = req.query;
    let filter = {};

    // If search term is provided, filter across title, description, instructor, and category
    if (search && typeof search === 'string' && search.trim() !== '') {
      const trimmedSearch = search.trim();
      // Escape special characters to prevent regex injection
      const escapedSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i'); // 'i' flag for case-insensitivity

      filter = {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { instructor: searchRegex },
          { category: searchRegex },
        ],
      };
    }

    // Query real MongoDB collection
    const courses = await Course.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses: courses || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /courses
 * @desc    Create a new course
 * @access  Private (Admin only)
 */
const createCourse = async (req, res, next) => {
  try {
    const { title, description, instructor, category, duration, fee } = req.body;

    // Validate required fields
    if (!title || !description || !instructor) {
      return res.status(400).json({
        success: false,
        message: 'Course title, description, and instructor are required',
      });
    }

    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedDesc = typeof description === 'string' ? description.trim() : '';
    const trimmedInstructor = typeof instructor === 'string' ? instructor.trim() : '';

    if (trimmedTitle.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Course title must be at least 3 characters long',
      });
    }

    if (trimmedDesc.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Course description must be at least 10 characters long',
      });
    }

    if (trimmedInstructor.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Instructor name must be at least 2 characters long',
      });
    }

    const parsedFee = fee !== undefined && fee !== null && !isNaN(Number(fee)) ? Number(fee) : 0;
    if (parsedFee < 0) {
      return res.status(400).json({
        success: false,
        message: 'Course fee cannot be negative',
      });
    }

    const newCourse = new Course({
      title: trimmedTitle,
      description: trimmedDesc,
      instructor: trimmedInstructor,
      category: category && typeof category === 'string' ? category.trim() : 'General',
      duration: duration && typeof duration === 'string' ? duration.trim() : 'Self-paced',
      fee: parsedFee,
    });

    const savedCourse = await newCourse.save();

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: savedCourse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /courses/:id or PUT /course/:id
 * @desc    Update an existing course
 * @access  Private (Admin only)
 */
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format',
      });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const { title, description, instructor, category, duration, fee } = req.body;

    if (title !== undefined) {
      const trimmedTitle = typeof title === 'string' ? title.trim() : '';
      if (trimmedTitle.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Course title must be at least 3 characters long',
        });
      }
      course.title = trimmedTitle;
    }

    if (description !== undefined) {
      const trimmedDesc = typeof description === 'string' ? description.trim() : '';
      if (trimmedDesc.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Course description must be at least 10 characters long',
        });
      }
      course.description = trimmedDesc;
    }

    if (instructor !== undefined) {
      const trimmedInstructor = typeof instructor === 'string' ? instructor.trim() : '';
      if (trimmedInstructor.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Instructor name must be at least 2 characters long',
        });
      }
      course.instructor = trimmedInstructor;
    }

    if (category !== undefined) {
      course.category = typeof category === 'string' ? category.trim() : 'General';
    }

    if (duration !== undefined) {
      course.duration = typeof duration === 'string' ? duration.trim() : 'Self-paced';
    }

    if (fee !== undefined) {
      const parsedFee = Number(fee);
      if (isNaN(parsedFee) || parsedFee < 0) {
        return res.status(400).json({
          success: false,
          message: 'Course fee must be a valid non-negative number',
        });
      }
      course.fee = parsedFee;
    }

    const updatedCourse = await course.save();

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @route   DELETE /courses/:id or DELETE /course/:id
 * @desc    Delete a course and cascade delete all its enrollments
 * @access  Private (Admin only)
 */
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format',
      });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Delete course
    await Course.findByIdAndDelete(id);

    // Cascade: delete any enrollments associated with this course
    const enrollmentDeleteResult = await Enrollment.deleteMany({ courseId: id });

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      deletedEnrollmentsCount: enrollmentDeleteResult.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
};

