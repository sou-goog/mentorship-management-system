// server/models/LeaveApplication.js
const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema(
  {
    mentee: { // The user (Mentee) who submitted the leave
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // References the User model
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide a start date for the leave'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide an end date for the leave'],
    },
    leaveType: {
      // FR-LAM-002: Type of Leave (e.g., Medical, Personal, Academic Duty - configurable list by Admin)
      // For now, a simple string. Could be an enum or ref to another collection if types are managed by Admin.
      type: String,
      required: [true, 'Please specify the type of leave'],
      trim: true,
    },
    reason: {
      // FR-LAM-002: Reason for Leave (textual description)
      type: String,
      required: [true, 'Please provide a reason for the leave'],
      trim: true,
    },
    status: {
      // FR-LAM-003, FR-LAM-011: Tracks the current status
      type: String,
      required: true,
      enum: [
        'Pending_Mentor',       // Initially submitted, waiting for Mentor
        'Pending_HOD',          // Recommended by Mentor, waiting for HOD
        'Pending_Dean',         // Approved by HOD, waiting for Dean
        'Approved',             // Final Approval
        'Rejected_Mentor',
        'Rejected_HOD',
        'Rejected_Dean',
        'Withdrawn',            // FR-LAM-017: Mentee withdrew
        'More_Info_Required',   // If an approver requests more info
      ],
      default: 'Pending_Mentor',
    },
    supportingDocuments: [ // FR-LAM-002: Optional array of document paths/URLs
      {
        originalName: String,
        filePath: String, // Path where file is stored (or URL if using cloud storage)
        fileType: String,
      }
    ],
    // FR-LAM-016: Comments from approvers can be stored in an audit trail
    // We can add an audit trail/history array later for comments and status changes
    // For now, let's keep it simple. We can add a field for current approver's comments if rejected.
    rejectionReason: { // If rejected, the reason can be stored here
        type: String,
        trim: true,
    },
    // Who is currently responsible for action? (Can be useful for dashboards)
    // currentApprover: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    // },
    // FR-UM-008, FR-LAM-003 to FR-LAM-009: Workflow participants
    // We'll determine these based on the mentee's assigned mentor, their department's HOD, etc.
    // at the application logic level rather than storing static IDs here initially,
    // unless the workflow is very rigid and pre-assigned.
    // Let's assume for now the mentee has an assignedMentor in their User document.
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Basic validation for endDate to be after startDate (can be more complex)
leaveApplicationSchema.pre('save', function (next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date.'));
  } else {
    next();
  }
});

const LeaveApplication = mongoose.model('LeaveApplication', leaveApplicationSchema);

module.exports = LeaveApplication;