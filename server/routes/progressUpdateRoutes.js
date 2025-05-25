// server/routes/progressUpdateRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // Important: mergeParams allows access to params from parent router
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createProgressUpdate,
  getProgressUpdatesForMentee,
} = require('../controllers/progressUpdateController'); // We'll create this

// Route to create a progress update for a specific mentee
// POST /api/mentees/:menteeId/progress-updates  (This will be the effective path)
router.post(
  '/', // Path is relative to where this router is mounted
  protect,
  authorize('Mentor'), // Only Mentors can create progress updates
  createProgressUpdate
);

// Route to get all progress updates for a specific mentee
// GET /api/mentees/:menteeId/progress-updates
router.get(
  '/',
  protect,
  authorize('Mentor', 'Guardian', 'Admin'), // Mentors, Guardians, Admins can view
  getProgressUpdatesForMentee
);

module.exports = router;