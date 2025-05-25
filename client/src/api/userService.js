// client/src/api/userService.js
import axios from 'axios';

const API_USERS_URL = 'http://localhost:5001/api/users'; // Assuming this is your base user route

const getAuthToken = () => {
  const userItem = localStorage.getItem('mms_user');
  if (userItem) {
    try {
      const user = JSON.parse(userItem);
      return user ? user.token : null;
    } catch (e) {
      console.error("Error parsing user from localStorage in userService", e);
      return null;
    }
  }
  return null;
};

// Get the currently logged-in user's profile (which should include assignedMentees for a Mentor)
const getMyProfile = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.get(`${API_USERS_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // Contains user object, including assignedMentees if mentor
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Error fetching my profile:', message);
    throw new Error(message);
  }
};

// Optional: A more specific function if your /profile doesn't populate mentees well,
// or if you want to fetch mentees with more details.
// For now, getMyProfile() should suffice if your backend /profile for mentor includes assignedMentees details.
// const getMyAssignedMenteesDetails = async () => { ... }

const userService = {
  getMyProfile,
};

export default userService;