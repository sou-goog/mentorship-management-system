// client/src/api/attendanceService.js
import axios from 'axios';

const API_SESSIONS_URL = 'http://localhost:5001/api/attendance/sessions';
const API_RECORDS_URL = 'http://localhost:5001/api/attendance/records';

// Ensure this function is fully defined
const getAuthToken = () => {
  const userItem = localStorage.getItem('mms_user');
  if (userItem) {
    try {
      const user = JSON.parse(userItem);
      return user ? user.token : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage in getAuthToken for attendanceService", e);
      return null;
    }
  }
  return null;
};

const createSession = async (sessionData) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.post(API_SESSIONS_URL, sessionData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Session creation successful:', response.data);
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Session creation error:', message);
    throw new Error(message);
  }
};

// Ensure this function is fully defined
const getMyCreatedSessions = async () => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated. No token found.');
    try {
        const response = await axios.get(`${API_SESSIONS_URL}/mentor`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        console.error('Error fetching created sessions:', message);
        throw new Error(message);
    }
};

// Get a single session by its ID
const getSessionById = async (sessionId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.get(`${API_SESSIONS_URL}/${sessionId}`, { // ENSURE backend GET /api/attendance/sessions/:id exists
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error(`Error fetching session ${sessionId}:`, message);
    throw new Error(message);
  }
};

// Get attendance records for a specific session
const getAttendanceForSession = async (sessionId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.get(`${API_RECORDS_URL}/session/${sessionId}`, { // ENSURE backend GET /api/attendance/records/session/:id exists
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error(`Error fetching attendance for session ${sessionId}:`, message);
    throw new Error(message);
  }
};

// Mark (or update) attendance for a session (batch)
const markAttendance = async (sessionId, attendanceData) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.post(API_RECORDS_URL,
      { sessionId, attendanceData },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Error marking attendance:', message);
    throw new Error(message);
  }
};

const getMyAttendanceRecords = async (menteeId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');

  try {
    // Assuming menteeId will be passed, which will be req.user._id from the component
    const response = await axios.get(`${API_RECORDS_URL}/mentee/${menteeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // Array of attendance records with populated session details
  } catch (error) {
    const message =
      (error.response?.data?.message) || error.message || error.toString();
    console.error(`Error fetching attendance records for mentee ${menteeId}:`, message);
    throw new Error(message);
  }
};

const attendanceService = {
  createSession,
  getMyCreatedSessions,
  getSessionById,
  getAttendanceForSession,
  markAttendance,
  // updateAttendanceRecordService, // We might have updateAttendanceRecord from backend test
  // getMenteeAttendanceService,    // Renaming this concept to getMyAttendanceRecords
  getMyAttendanceRecords, // <<< ADDED
};

export default attendanceService;