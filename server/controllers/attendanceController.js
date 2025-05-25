// server/controllers/attendanceController.js
const Session = require('../models/Session');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');
const LeaveApplication = require('../models/LeaveApplication');
const mongoose = require('mongoose');

// @desc    Create a new session
// @route   POST /api/attendance/sessions
// @access  Private (Mentor only)
const createSession = async (req, res, next) => {
  const { title, description, sessionDate, expectedMentees } = req.body;
  const mentorId = req.user._id;

  try {
    if (!title || !sessionDate) {
      res.status(400);
      throw new Error('Session title and date are required.');
    }

    // Validate expectedMentees if provided
    if (expectedMentees && Array.isArray(expectedMentees) && expectedMentees.length > 0) {
      const mentorDoc = await User.findById(mentorId).select('assignedMentees');
      if (!mentorDoc || !mentorDoc.assignedMentees) {
        res.status(404);
        throw new Error('Mentor details not found or mentor has no assigned mentees list.');
      }
      const mentorAssignedMenteesStrings = mentorDoc.assignedMentees.map(id => id.toString());

      for (const menteeId of expectedMentees) {
        if (!mongoose.Types.ObjectId.isValid(menteeId)) {
          res.status(400);
          throw new Error(`Invalid Mentee ID format provided in expectedMentees: ${menteeId}`);
        }
        if (!mentorAssignedMenteesStrings.includes(menteeId.toString())) {
          res.status(400);
          throw new Error(`Mentee with ID ${menteeId} is not assigned to you.`);
        }
        const menteeExists = await User.findOne({ _id: menteeId, role: 'Mentee' });
        if (!menteeExists) {
          res.status(400);
          throw new Error(`User with ID ${menteeId} is not a valid Mentee.`);
        }
      }
    }

    const session = await Session.create({
      title,
      description,
      sessionDate,
      mentor: mentorId,
      // Use provided expectedMentees or default to empty array if not provided/invalid
      expectedMentees: (expectedMentees && Array.isArray(expectedMentees)) ? expectedMentees : [],
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sessions created by the logged-in mentor
// @route   GET /api/attendance/sessions/mentor
// @access  Private (Mentor only)
const getSessionsByMentor = async (req, res, next) => {
  try {
    const sessions = await Session.find({ mentor: req.user._id }).sort({ sessionDate: -1 });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single session by ID
// @route   GET /api/attendance/sessions/:sessionId
// @access  Private (Mentor who owns it, or Admin)
const getSessionByIdController = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400);
      throw new Error('Invalid session ID format.');
    }

    const session = await Session.findById(sessionId)
      .populate('mentor', 'firstName lastName email')
      .populate('expectedMentees', 'firstName lastName email');

    if (!session) {
      res.status(404);
      throw new Error('Session not found.');
    }

    if (
      req.user.role !== 'Admin' &&
      session.mentor._id.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error('Not authorized to view this session.');
    }

    if (session.expectedMentees && session.expectedMentees.length > 0) {
    const sessionDateOnly = new Date(new Date(session.sessionDate).setUTCHours(0, 0, 0, 0));
    
    const processedMentees = await Promise.all(
        session.expectedMentees.map(async (mentee) => {
            if (!mentee) {
                console.log('[getSessionByIdController] Found a null/undefined mentee in expectedMentees for session:', sessionId);
                return null;
            }

            console.log(`--- [BACKEND DEBUG] For Mentee ID: ${mentee._id} (${mentee.firstName} ${mentee.lastName}) ---`);
            console.log(`[BACKEND DEBUG] Session Date for Check (sessionDateOnly): ${sessionDateOnly.toISOString()}`);

            const approvedLeave = await LeaveApplication.findOne({
                mentee: mentee._id,
                status: 'Approved',
                startDate: { $lte: sessionDateOnly },
                endDate: { $gte: sessionDateOnly },
            }).lean(); // .lean() is good here as we only read

            console.log('[BACKEND DEBUG] Leave Application Query Sent:', {
                mentee: mentee._id,
                status: 'Approved',
                startDate_lte: sessionDateOnly.toISOString(),
                endDate_gte: sessionDateOnly.toISOString(),
            });
            console.log('[BACKEND DEBUG] Found Overlapping Approved Leave:', JSON.stringify(approvedLeave, null, 2));
            const isOnLeave = !!approvedLeave; // Calculate the boolean
            console.log(`[BACKEND DEBUG] Setting isOnApprovedLeave for ${mentee.firstName}: ${isOnLeave}`);
            console.log('------------------------------------');

            return { // Return a new object; do not modify populated 'mentee' directly
                _id: mentee._id,
                firstName: mentee.firstName,
                lastName: mentee.lastName,
                email: mentee.email, // Assuming email was populated
                isOnApprovedLeave: isOnLeave, // Use the calculated value
            };
        })
    );
        
         const responseSession = session.toObject();
    responseSession.expectedMentees = processedMentees.filter(m => m !== null);
    console.log('[getSessionByIdController] Sending responseSession to frontend:', JSON.stringify(responseSession, null, 2));
    return res.json(responseSession);
    }

    // Fallback if no expectedMentees or if the 'if' block doesn't return.
    // Convert to plain object if you haven't transformed it.
    return res.json(session.toObject ? session.toObject() : session);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark or update attendance for multiple mentees for a session
// @route   POST /api/attendance/records
// @access  Private (Mentor only)
const markAttendance = async (req, res, next) => {
  const { sessionId, attendanceData } = req.body;
  const mentorId = req.user._id;

  try {
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400);
      throw new Error('Valid session ID is required.');
    }
    if (!attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
      res.status(400);
      throw new Error('Attendance data array is required and cannot be empty.');
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      res.status(404);
      throw new Error('Session not found.');
    }
    if (session.mentor.toString() !== mentorId.toString()) {
      res.status(403);
      throw new Error('You are not authorized to mark attendance for this session.');
    }

    const results = [];
    const errors = [];
    const sessionDateOnly = new Date(new Date(session.sessionDate).setUTCHours(0, 0, 0, 0));

    for (const record of attendanceData) {
      const { menteeId, status, notes } = record;

      if (!menteeId || !mongoose.Types.ObjectId.isValid(menteeId) || !status) {
        errors.push({ menteeId: menteeId || 'Unknown', error: 'Missing menteeId or status for a record.' });
        continue;
      }

      let finalStatus = status;
      const approvedLeave = await LeaveApplication.findOne({
        mentee: menteeId,
        status: 'Approved',
        startDate: { $lte: sessionDateOnly },
        endDate: { $gte: sessionDateOnly },
      });

      if (approvedLeave) {
        finalStatus = 'On_Approved_Leave'; // Note: Schema uses 'On Approved Leave'
      }

      try {
        const attendanceRecord = await AttendanceRecord.findOneAndUpdate(
          { session: sessionId, mentee: menteeId },
          {
            session: sessionId,
            mentee: menteeId,
            status: finalStatus,
            notes: notes || '',
            markedBy: mentorId,
          },
          { upsert: true, new: true, runValidators: true }
        ).populate('mentee', 'firstName lastName email');
        results.push(attendanceRecord);
      } catch (validationError) {
        errors.push({ menteeId, error: validationError.message });
      }
    }

    if (errors.length > 0 && results.length === 0) {
        res.status(400);
        throw new Error(`Failed to process all attendance records. Errors: ${errors.map(e => `${e.menteeId}: ${e.error}`).join(', ')}`);
    } else if (errors.length > 0) {
      return res.status(207).json({
        message: 'Attendance marked with some errors.',
        successes: results,
        errors: errors,
      });
    }

    res.status(201).json({
      message: 'Attendance marked successfully.',
      records: results,
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendance records for a specific session
// @route   GET /api/attendance/records/session/:sessionId
// @access  Private (Mentor: their sessions, Admin: any session)
const getAttendanceForSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400);
        throw new Error('Invalid session ID format.');
    }

    const session = await Session.findById(sessionId);
    if (!session) {
        res.status(404);
        throw new Error('Session not found.');
    }

    if (req.user.role === 'Mentor' && session.mentor.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view attendance for this session.');
    }

    const attendanceRecords = await AttendanceRecord.find({ session: sessionId })
      .populate('mentee', 'firstName lastName email')
      .populate('session', 'title sessionDate')
      .sort({ createdAt: 'asc' });

    res.json(attendanceRecords);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendance records for a specific mentee
// @route   GET /api/attendance/records/mentee/:menteeId
// @access  Private (Mentee: self, Mentor: their mentee, Admin: any)
const getAttendanceForMentee = async (req, res, next) => {
  try {
    const { menteeId } = req.params;
     if (!mongoose.Types.ObjectId.isValid(menteeId)) {
        res.status(400);
        throw new Error('Invalid mentee ID format.');
    }

    const targetMentee = await User.findById(menteeId);
    if (!targetMentee || targetMentee.role !== 'Mentee') {
        res.status(404);
        throw new Error('Mentee not found.');
    }

    const loggedInUser = req.user;
    let isAuthorized = false;

    if (loggedInUser.role === 'Admin') {
      isAuthorized = true;
    } else if (loggedInUser.role === 'Mentee' && loggedInUser._id.toString() === menteeId.toString()) {
      isAuthorized = true;
    } else if (loggedInUser.role === 'Mentor') {
      const mentorDoc = await User.findById(loggedInUser._id).select('assignedMentees');
      if (mentorDoc && mentorDoc.assignedMentees.map(id => id.toString()).includes(menteeId.toString())) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      res.status(403);
      throw new Error('Not authorized to view attendance for this mentee.');
    }

    const attendanceRecords = await AttendanceRecord.find({ mentee: menteeId })
      .populate({
          path: 'session',
          select: 'title sessionDate',
          populate: { path: 'mentor', select: 'firstName lastName'}
      })
      .populate('mentee', 'firstName lastName')
      .sort({ 'session.sessionDate': -1, createdAt: -1 });

    res.json(attendanceRecords);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a specific attendance record
// @route   PUT /api/attendance/records/:recordId
// @access  Private (Mentor who marked it or Admin)
const updateAttendanceRecord = async (req, res, next) => {
  const { recordId } = req.params;
  const { status, notes } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
        res.status(400);
        throw new Error('Invalid attendance record ID format.');
    }
    if (!status) {
        res.status(400);
        throw new Error('Status is required for update.');
    }

    const record = await AttendanceRecord.findById(recordId).populate('session');
    if (!record) {
      res.status(404);
      throw new Error('Attendance record not found.');
    }
    if (!record.session) {
        res.status(500);
        throw new Error('Associated session data is missing for the attendance record.');
    }

    if (req.user.role !== 'Admin' && record.markedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this attendance record.');
    }
    
    const sessionDateOnly = new Date(new Date(record.session.sessionDate).setUTCHours(0, 0, 0, 0));
    let finalStatus = status;

    // If a user tries to change status from On_Approved_Leave, but an approved leave still exists,
    // it should revert to On_Approved_Leave.
    // If they set it to On_Approved_Leave but no leave exists, the backend markAttendance would handle it,
    // but for update, we should be careful. Let's primarily let backend `markAttendance` handle the initial set.
    // For update, we primarily allow changing from other statuses or notes.
    // If the original status was 'On_Approved_Leave' due to a leave, and the leave is still active,
    // it shouldn't be changeable to something else here.
    // This logic might need refinement based on how strictly "On Approved Leave" overrides.
    const approvedLeave = await LeaveApplication.findOne({
        mentee: record.mentee,
        status: 'Approved',
        startDate: { $lte: sessionDateOnly },
        endDate: { $gte: sessionDateOnly },
    });

    if (approvedLeave) { // If an approved leave exists for this date
        finalStatus = 'On_Approved_Leave'; // It MUST be this status
    } else if (record.status === 'On_Approved_Leave' && !approvedLeave) {
      // If current status is On_Approved_Leave but no leave exists (e.g. leave was cancelled after attendance marked)
      // then the new status from req.body should take precedence.
      // This case is already handled by `finalStatus = status;` if `approvedLeave` is null.
    }


    record.status = finalStatus;
    record.notes = notes !== undefined ? notes.trim() : record.notes; // Trim notes
    record.markedBy = req.user._id; // Update who last marked/updated it

    const updatedRecord = await record.save();
    const responseRecord = await AttendanceRecord.findById(updatedRecord._id)
                                .populate('mentee', 'firstName lastName email');
    res.json(responseRecord);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  getSessionsByMentor,
  getSessionByIdController,
  markAttendance,
  getAttendanceForSession,
  getAttendanceForMentee,
  updateAttendanceRecord,
};