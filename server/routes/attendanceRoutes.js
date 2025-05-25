// server/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const {
  createSession,
  getSessionsByMentor,
  getSessionByIdController,
  markAttendance,
  getAttendanceForSession,
  getAttendanceForMentee,
  updateAttendanceRecord, // For correcting mistakes
  // deleteSession, // Optional
} = require('../controllers/attendanceController'); // We will create this controller
const { protect, authorize } = require('../middleware/authMiddleware');

// === Session Management Routes (Typically Mentor actions) ===
router.post(
  '/sessions',
  protect,
  authorize('Mentor'), // Only Mentors can create sessions
  createSession
);
router.get(
  '/sessions/mentor', // Gets all sessions created by the logged-in mentor
  protect,
  authorize('Mentor'),
  getSessionsByMentor
);
router.get(
    '/sessions/:sessionId', // Route to get a specific session by ID
    protect,
    // Authorize Mentor (owner) or Admin, or maybe even involved Mentees later
    authorize('Mentor', 'Admin'), // For now, Mentor or Admin
    getSessionByIdController
);
// router.put('/sessions/:sessionId', protect, authorize('Mentor'), updateSession); // Optional
// router.delete('/sessions/:sessionId', protect, authorize('Mentor'), deleteSession); // Optional


// === Attendance Marking and Viewing Routes ===
router.post(
  '/records', // Mentor marks attendance (can be for multiple mentees for a session)
  protect,
  authorize('Mentor'),
  markAttendance
);
router.put(
  '/records/:recordId', // Mentor updates a specific attendance record
  protect,
  authorize('Mentor'),
  updateAttendanceRecord
);
router.get(
  '/records/session/:sessionId', // Get all attendance for a specific session (Mentor or Admin view)
  protect,
  authorize('Mentor', 'Admin'), // Example authorization
  getAttendanceForSession
);
router.get(
  '/records/mentee/:menteeId', // Get all attendance for a specific mentee (Mentee, their Mentor, Admin view)
  protect, // Further auth inside controller to check if mentee is self or mentor is assigned
  getAttendanceForMentee
);
// This could also be GET /records/mentee/my (for a mentee to get their own)

module.exports = router;