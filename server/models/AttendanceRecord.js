// server/models/AttendanceRecord.js
const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: { // Which session this record is for
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Session',
    },
    mentee: { // Which mentee this record is for
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      required: [true, 'Attendance status is required'],
      enum: ['Present', 'Absent', 'Late', 'Excused', 'On_Approved_Leave'],
      // 'On_Approved_Leave' could be set automatically if a leave covers the sessionDate
    },
    notes: { // Optional notes by the mentor
      type: String,
      trim: true,
    },
    markedBy: { // The Mentor who marked this attendance
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true, // createdAt (when marked), updatedAt
  }
);

// To ensure one attendance record per mentee per session
attendanceRecordSchema.index({ session: 1, mentee: 1 }, { unique: true });

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
module.exports = AttendanceRecord;