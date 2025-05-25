// server/models/ProgressUpdate.js
const mongoose = require('mongoose');

const progressUpdateSchema = new mongoose.Schema(
  {
    mentor: { // The Mentor who wrote the update
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    mentee: { // The Mentee this update is about
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // We might not need a direct guardian ref here if we fetch guardians via the mentee.
    // But if an update is specifically *sent* to one guardian among many, it could be useful.
    // For simplicity now, we assume the update is for all linked guardians of the mentee.
    // guardian: { // The specific Guardian this was sent to (optional if sent to all)
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    // },
    updateText: {
      type: String,
      required: [true, 'Update text cannot be empty'],
      trim: true,
    },
    // Optional: add a subject or type for the update
    // subject: { type: String, trim: true },
  },
  {
    timestamps: true, // Adds createdAt (when update was made) and updatedAt
  }
);

const ProgressUpdate = mongoose.model('ProgressUpdate', progressUpdateSchema);

module.exports = ProgressUpdate;