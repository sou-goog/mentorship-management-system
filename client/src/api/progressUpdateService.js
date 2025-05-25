// client/src/api/progressUpdateService.js
import axios from 'axios';

// Base URL for progress updates is nested under mentees
// Example: /api/mentees/:menteeId/progress-updates
const API_MENTEES_URL = 'http://localhost:5001/api/mentees';

const getAuthToken = () => {
  const userItem = localStorage.getItem('mms_user');
  if (userItem) {
    try {
      const user = JSON.parse(userItem);
      return user ? user.token : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage in getAuthToken for progressUpdateService", e);
      return null;
    }
  }
  return null;
};

// Create a progress update for a specific mentee (by a Mentor)
const createProgressUpdate = async (menteeId, updateData) => { // updateData should be like { updateText: "..." }
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');

  if (!menteeId) throw new Error('Mentee ID is required to create a progress update.');
  if (!updateData || !updateData.updateText || updateData.updateText.trim() === '') {
    throw new Error('Update text cannot be empty.');
  }

  try {
    const response = await axios.post(
      `${API_MENTEES_URL}/${menteeId}/progress-updates`,
      updateData, // e.g., { updateText: "Student did well." }
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log('Progress update creation successful:', response.data);
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Progress update creation error:', message);
    throw new Error(message);
  }
};

// Get all progress updates for a specific mentee (for Mentor or Guardian)
const getProgressUpdatesForMentee = async (menteeId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');

  if (!menteeId) throw new Error('Mentee ID is required to fetch progress updates.');

  try {
    const response = await axios.get(
      `${API_MENTEES_URL}/${menteeId}/progress-updates`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data; // This should be an array of progress update objects
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error(`Error fetching progress updates for mentee ${menteeId}:`, message);
    throw new Error(message);
  }
};

const progressUpdateService = {
  createProgressUpdate,
  getProgressUpdatesForMentee,
};

export default progressUpdateService;