// server/models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    sessionDate: {
      type: Date,
      required: [true, 'Session date is required'],
    },
    mentor: { // The Mentor who created/is responsible for this session
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // Mentees expected to attend this session.
    // This helps in knowing who to mark attendance for.
    // Can be pre-populated by the mentor when creating the session.
    expectedMentees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Optional: Link to a program if sessions are part of specific programs
    // program: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Program', // Assuming you might have a Program model later
    // },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Optional: Ensure a mentor doesn't create duplicate sessions (same title and date)
// sessionSchema.index({ title: 1, sessionDate: 1, mentor: 1 }, { unique: true });

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;