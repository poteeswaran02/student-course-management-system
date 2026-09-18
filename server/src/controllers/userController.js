const { User } = require('../models');

/**
 * Helper to validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * @route   GET /profile (or /api/profile)
 * @desc    Get logged in user's profile
 * @access  Private (Requires JWT)
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user is attached by the protect middleware without password
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access profile.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully.',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /profile (or /api/profile)
 * @desc    Update logged in user's profile (name and email)
 * @access  Private (Requires JWT)
 */
const updateProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update profile.',
      });
    }

    const { name, email } = req.body;

    // Validate presence of at least one field or valid data
    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least a name or email to update.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // 1. Update Name if provided
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long.',
        });
      }
      user.name = trimmedName;
    }

    // 2. Update Email if provided
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
        });
      }

      // Check if another user is already registered with this email
      if (normalizedEmail !== user.email) {
        const emailExists = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });

        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Email is already in use by another account.',
          });
        }
        user.email = normalizedEmail;
      }
    }

    // Strict security rule: role and password cannot be modified through this endpoint
    // (user.role remains unchanged, user.password remains untouched)

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /students (or /api/students)
 * @desc    Get all registered students (excludes password)
 * @access  Private (Admin only)
 */
const getStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students: students || [],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getStudents,
};

