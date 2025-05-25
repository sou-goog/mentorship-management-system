// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Import authorize

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);

// New route: Get all users (Admin only)
// Note the order: 'protect' first, then 'authorize'
//router.get('/', protect, authorize('Admin'), getUsers);

module.exports = router;