const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Public Authentication Endpoints
 */
router.post('/register', register);
router.post('/login', login);

/**
 * Protected Authentication Verification Endpoint
 */
router.get('/me', protect, getMe);

/**
 * Role Authorization Verification Endpoint (for testing admin role check)
 */
router.get('/admin-test', protect, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted.',
    user: req.user,
  });
});

module.exports = router;
