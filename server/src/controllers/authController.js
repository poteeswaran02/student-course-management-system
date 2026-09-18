const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Generate JWT token containing userId and role
 */
const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'student_course_management_jwt_secret_dev_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  return jwt.sign({ userId, role }, secret, { expiresIn });
};

/**
 * Helper to validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * @route   POST /register (or /api/auth/register)
 * @desc    Register a new student
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // 2. Validate field lengths and formats
    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long.',
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // 3. Check whether the email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered. Please login instead.',
      });
    }

    // 4. Create new User
    // Always default to 'student' role; do not allow normal registration to set 'admin'
    const newUser = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password, // Hashed automatically by pre-save hook in User model
      role: 'student',
    });

    // 5. Return safe user information (never return password)
    return res.status(201).json({
      success: true,
      message: 'Student registered successfully.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /login (or /api/auth/login)
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Find user by email (explicitly selecting password since it is excluded by default)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 3. Compare supplied password with stored bcrypt hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id, user.role);

    // 5. Return success response (never return password)
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /me (or /api/auth/me)
 * @desc    Get current authenticated user profile
 * @access  Private (Requires protect middleware)
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Authenticated user profile retrieved.',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
