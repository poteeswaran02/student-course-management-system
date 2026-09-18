const express = require('express');
const { getProfile, updateProfile, getStudents } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin route: View registered students
router.get('/students', protect, authorizeRoles('admin'), getStudents);

module.exports = router;

