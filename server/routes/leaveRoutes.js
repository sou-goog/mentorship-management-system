// server/routes/leaveRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams for potential parent routes if any
const {
  submitLeaveApplication,
  getMyLeaveApplications,
  withdrawLeaveApplication,
  getPendingMentorApprovals,
  approveLeaveByMentor,
  rejectLeaveByMentor,
  getPendingHODApprovals,
  approveLeaveByHOD,
  rejectLeaveByHOD,
  getPendingDeanApprovals,
  approveLeaveByDean,
  rejectLeaveByDean,
  getLeaveApplicationDetails,    // For viewing details in modal
  downloadLeaveApplicationAsPDF, // <<< NEW for PDF download
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // For file uploads

// === Mentee Routes ===
router.post(
  '/',
  protect,
  authorize('Mentee'),
  upload.array('supportingDocuments', 5), // Multer for file uploads
  submitLeaveApplication
);
router.get('/myapplications', protect, authorize('Mentee'), getMyLeaveApplications);
router.put('/:id/withdraw', protect, authorize('Mentee'), withdrawLeaveApplication);

// === Mentor Routes ===
router.get('/pending-for-mentor', protect, authorize('Mentor'), getPendingMentorApprovals);
router.put('/:id/approve-mentor', protect, authorize('Mentor'), approveLeaveByMentor);
router.put('/:id/reject-mentor', protect, authorize('Mentor'), rejectLeaveByMentor);

// === HOD Routes ===
router.get('/pending-for-hod', protect, authorize('HOD'), getPendingHODApprovals);
router.put('/:id/approve-hod', protect, authorize('HOD'), approveLeaveByHOD);
router.put('/:id/reject-hod', protect, authorize('HOD'), rejectLeaveByHOD);

// === Dean Routes ===
router.get('/pending-for-dean', protect, authorize('Dean'), getPendingDeanApprovals);
router.put('/:id/approve-dean', protect, authorize('Dean'), approveLeaveByDean);
router.put('/:id/reject-dean', protect, authorize('Dean'), rejectLeaveByDean);

// === General Leave Detail & Download Routes ===
// Accessible by authenticated users; more specific auth can be in controller
router.get('/:id/details', protect, getLeaveApplicationDetails);
router.get('/:id/download-pdf', protect, downloadLeaveApplicationAsPDF); // <<< NEW ROUTE

module.exports = router;