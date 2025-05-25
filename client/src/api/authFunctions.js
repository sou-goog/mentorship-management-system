// client/src/api/authFunctions.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api/users'; // Your backend user API

const register = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, userData);
    if (response.data) {
      console.log('Registration successful (from authFunctions):', response.data);
    }
    return response.data;
  } catch (error) {
    const message =
      (error.response &&
        error.response.data &&
        error.response.data.message) ||
      error.message ||
      error.toString();
    console.error('Registration error (from authFunctions):', message);
    throw new Error(message);
  }
};

const login = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, userData);
    if (response.data) {
      console.log('Login successful (from authFunctions):', response.data);
    }
    return response.data;
  } catch (error) {
    const message =
      (error.response &&
        error.response.data &&
        error.response.data.message) ||
      error.message ||
      error.toString();
    console.error('Login error (from authFunctions):', message);
    throw new Error(message);
  }
};

const logout = () => {
  console.log('User logged out (placeholder from authFunctions)');
};

// Group the functions into an object to export
const authFunctions = {
  register,
  login,
  logout,
};

export default authFunctions; // Export the object