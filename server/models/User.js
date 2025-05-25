// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 3, // As per your current setting
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: ['Mentee', 'Mentor', 'HOD', 'Dean', 'Admin', 'Guardian'], // <<< ADDED 'Guardian'
      default: 'Mentee',
    },
    department: {
      type: String,
      trim: true,
    },
    assignedMentor: { // For users with role 'Mentee'
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedMentees: [ // For users with role 'Mentor'
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // START: New fields for Guardian-Mentee relationship
    guardianUserIds: [ // For Mentees: an array of their Guardian's User ObjectIds
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References User documents with role 'Guardian'
      }
    ],
    linkedMenteeIds: [ // For Guardians: an array of their Mentee's User ObjectIds
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References User documents with role 'Mentee'
      }
    ]
    // END: New fields for Guardian-Mentee relationship
  },
  {
    timestamps: true,
  }
);

// Mongoose middleware: Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Mongoose instance method: To compare entered password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;