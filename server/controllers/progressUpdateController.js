// server/controllers/progressUpdateController.js
const ProgressUpdate = require('../models/ProgressUpdate');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Mentor creates a progress update for a mentee
// @route   POST /api/mentees/:menteeId/progress-updates
// @access  Private (Mentor only)
const createProgressUpdate = async (req, res, next) => {
  const { updateText } = req.body;
  const mentorId = req.user._id; // Logged-in mentor
  const menteeId = req.params.menteeId; // From the URL parameter

  try {
    if (!updateText || updateText.trim() === '') {
      res.status(400);
      throw new Error('Update text is required.');
    }

    if (!mongoose.Types.ObjectId.isValid(menteeId)) {
      res.status(400);
      throw new Error('Invalid Mentee ID format.');
    }

    // Verify mentee exists and is actually a mentee
    const mentee = await User.findById(menteeId);
    if (!mentee || mentee.role !== 'Mentee') {
      res.status(404);
      throw new Error('Mentee not found or user is not a mentee.');
    }

    // Verify logged-in mentor is assigned to this mentee
    if (mentee.assignedMentor?.toString() !== mentorId.toString()) {
      res.status(403); // Forbidden
      throw new Error('You are not authorized to create updates for this mentee.');
    }

    // Check if the mentee has any linked guardians
    if (!mentee.guardianUserIds || mentee.guardianUserIds.length === 0) {
        // Decide on behavior: still create update but can't be seen by guardian? Or error?
        // For now, let's allow creating it. Notifications would target these guardians.
        console.log(`Mentee ${menteeId} has no linked guardians. Update created for mentor records.`);
    }


    const progressUpdate = await ProgressUpdate.create({
      mentor: mentorId,
      mentee: menteeId,
      updateText,
      // If sending to a specific guardian among many, you'd pass guardianId in req.body
      // For now, it's just logged against the mentee, viewable by any linked guardian.
    });

    // TODO: Trigger notification for guardianUserIds of this mentee

    res.status(201).json(progressUpdate);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all progress updates for a specific mentee
// @route   GET /api/mentees/:menteeId/progress-updates
// @access  Private (Assigned Mentor, Linked Guardian(s), Admin)
const getProgressUpdatesForMentee = async (req, res, next) => {
  const menteeId = req.params.menteeId;
  const loggedInUserId = req.user._id;
  const loggedInUserRole = req.user.role;

  try {
    if (!mongoose.Types.ObjectId.isValid(menteeId)) {
      res.status(400);
      throw new Error('Invalid Mentee ID format.');
    }

    const mentee = await User.findById(menteeId).select('assignedMentor guardianUserIds role');
    if (!mentee || mentee.role !== 'Mentee') {
      res.status(404);
      throw new Error('Mentee not found or user is not a mentee.');
    }

    // Authorization check
    let isAuthorized = false;
    if (loggedInUserRole === 'Admin') {
      isAuthorized = true;
    } else if (loggedInUserRole === 'Mentor' && mentee.assignedMentor?.toString() === loggedInUserId.toString()) {
      isAuthorized = true;
    } else if (loggedInUserRole === 'Guardian' && mentee.guardianUserIds && mentee.guardianUserIds.map(id => id.toString()).includes(loggedInUserId.toString())) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      res.status(403);
      throw new Error('You are not authorized to view these progress updates.');
    }

    const updates = await ProgressUpdate.find({ mentee: menteeId })
      .populate('mentor', 'firstName lastName email') // Show who wrote the update
      .sort({ createdAt: -1 }); // Newest first

    res.json(updates);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProgressUpdate,
  getProgressUpdatesForMentee,
};