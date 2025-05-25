// server/controllers/userController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res, next) => { // <<< 'registerUser' is defined here
  // ... your registration logic ...
  const { firstName, lastName, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
    });
    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
}; // <<< End of registerUser function

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res, next) => { // <<< 'loginUser' is defined here
  // ... your login logic ...
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
}; // <<< End of loginUser function

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (needs token)
const getUserProfile = async (req, res, next) => {
  try {
    let userQuery = User.findById(req.user._id);

    if (req.user.role === 'Mentor') {
      userQuery = userQuery.populate('assignedMentees', 'firstName lastName email _id');
    }
    if (req.user.role === 'Mentee') {
      userQuery = userQuery.populate('assignedMentor', 'firstName lastName email _id');
      userQuery = userQuery.populate('guardianUserIds', 'firstName lastName email _id'); // For mentee to see their guardians
    }
    if (req.user.role === 'Guardian') {
      userQuery = userQuery.populate('linkedMenteeIds', 'firstName lastName email _id');
    }

    const user = await userQuery; // Execute the query

    if (user) {
      // Construct the response object carefully
      const userObject = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        // Only include role-specific fields if they exist on the user object
      };
      if (user.assignedMentor) userObject.assignedMentor = user.assignedMentor;
      if (user.assignedMentees) userObject.assignedMentees = user.assignedMentees;
      if (user.guardianUserIds) userObject.guardianUserIds = user.guardianUserIds;
      if (user.linkedMenteeIds) userObject.linkedMenteeIds = user.linkedMenteeIds;
      
      res.json(userObject);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,   // <<< Trying to export 'registerUser'
  loginUser,
  getUserProfile,
};