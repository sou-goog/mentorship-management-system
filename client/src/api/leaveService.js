// client/src/api/leaveService.js (or your service file path)
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/leaves';

const getAuthToken = () => {
  const userItem = localStorage.getItem('mms_user');
  if (userItem) {
    try {
      const user = JSON.parse(userItem);
      return user ? user.token : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage in getAuthToken", e);
      return null;
    }
  }
  return null;
};


// Submit a new leave application
const submitLeave = async (leaveData, files) => { // 'files' is an array of File objects
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. No token found.');
  }

  // Create FormData object
  const formData = new FormData();
  formData.append('startDate', leaveData.startDate);
  formData.append('endDate', leaveData.endDate);
  formData.append('leaveType', leaveData.leaveType);
  formData.append('reason', leaveData.reason);

  // Append files if any
  // The backend multer middleware expects files under the field name 'supportingDocuments'
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      formData.append('supportingDocuments', files[i]);
    }
  }

  try {
    const response = await axios.post(API_URL, formData, { // Send formData
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Content-Type': 'multipart/form-data' will be set automatically by axios when sending FormData
      },
    });
    console.log('Leave submission successful (with files):', response.data);
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Leave submission error (with files):', message);
    throw new Error(message);
  }
};
// VVVVVV NEW FUNCTION VVVVVV
// Get all leave applications for the currently logged-in mentee
const getMyLeaves = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. No token found.');
  }

  try {
    const response = await axios.get(`${API_URL}/myapplications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // This should be an array of leave applications
  } catch (error) {
    const message =
      (error.response &&
        error.response.data &&
        error.response.data.message) ||
      error.message ||
      error.toString();
    console.error('Error fetching my leaves:', message);
    throw new Error(message);
  }
};
const withdrawLeave = async (leaveId) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. No token found.');
  }

  try {
    // The backend route is PUT /api/leaves/:id/withdraw
    const response = await axios.put(`${API_URL}/${leaveId}/withdraw`, {}, { // Empty object as body if no data needed
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Leave withdrawal successful:', response.data);
    return response.data; // Returns the updated leave application
  } catch (error) {
    const message =
      (error.response &&
        error.response.data &&
        error.response.data.message) ||
      error.message ||
      error.toString();
    console.error('Error withdrawing leave:', message);
    throw new Error(message);
  }
};
// ^^^^^^ END NEW FUNCTION ^^^^^^
// Get leave applications pending for the logged-in mentor
const getMentorPending = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.get(`${API_URL}/pending-for-mentor`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Error fetching mentor pending leaves:', message);
    throw new Error(message);
  }
};

// Mentor approves a leave application
const approveByMentor = async (leaveId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.put(`${API_URL}/${leaveId}/approve-mentor`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Error approving leave by mentor:', message);
    throw new Error(message);
  }
};

// Mentor rejects a leave application
const rejectByMentor = async (leaveId, rejectionReason) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.put(`${API_URL}/${leaveId}/reject-mentor`,
      { rejectionReason },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Error rejecting leave by mentor:', message);
    throw new Error(message);
  }
};
const getHODPending = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.get(`${API_URL}/pending-for-hod`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Error fetching HOD pending leaves:', message);
    throw new Error(message);
  }
};

const approveByHOD = async (leaveId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.put(`${API_URL}/${leaveId}/approve-hod`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Error approving leave by HOD:', message);
    throw new Error(message);
  }
};

const rejectByHOD = async (leaveId, rejectionReason) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.put(`${API_URL}/${leaveId}/reject-hod`,
      { rejectionReason },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Error rejecting leave by HOD:', message);
    throw new Error(message);
  }
};
// ^^^^^^ END NEW FUNCTIONS FOR HOD ^^^^^^
const getDeanPending = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.get(`${API_URL}/pending-for-dean`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Error fetching Dean pending leaves:', message);
    throw new Error(message);
  }
};

const approveByDean = async (leaveId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.put(`${API_URL}/${leaveId}/approve-dean`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // Returns the leave with status 'Approved'
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Error approving leave by Dean:', message);
    throw new Error(message);
  }
};

const rejectByDean = async (leaveId, rejectionReason) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.put(`${API_URL}/${leaveId}/reject-dean`,
      { rejectionReason },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data; // Returns the leave with status 'Rejected_Dean'
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error('Error rejecting leave by Dean:', message);
    throw new Error(message);
  }
};

const getLeaveApplicationById = async (leaveId) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated. No token found.');
  try {
    const response = await axios.get(`${API_URL}/${leaveId}/details`, { // Calls the new backend route
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const message = (error.response?.data?.message) || error.message || error.toString();
    console.error(`Error fetching leave application details for ${leaveId}:`, message);
    throw new Error(message);
  }
};


// ^^^^^^ END NEW FUNCTIONS FOR DEAN ^^^^^^

const leaveService = {
  // ... (all previous functions: submitLeave, getMyLeaves, withdrawLeave, getMentorPending, approveByMentor, rejectByMentor, getHODPending, approveByHOD, rejectByHOD)
  submitLeave,
  getMyLeaves,
  withdrawLeave,
  getMentorPending,
  approveByMentor,
  rejectByMentor,
  getHODPending,
  approveByHOD,
  rejectByHOD,
  getDeanPending,    // <<< ADDED
  approveByDean,     // <<< ADDED
  rejectByDean,  
  getLeaveApplicationById,    // <<< ADDED
};

export default leaveService;