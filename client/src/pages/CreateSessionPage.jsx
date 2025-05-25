// client/src/pages/CreateSessionPage.jsx
import React, { useState } from 'react';
import attendanceService from '../api/attendanceService.js'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom'; // Keep for navigation
// import { useAuth } from '../contexts/AuthContext.jsx'; // Not strictly needed if not displaying user-specific info from context here

const CreateSessionPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sessionDate: '',
    expectedMentees: [], // Stores as an array of strings (IDs)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleExpectedMenteesChange = (e) => {
    // Convert comma-separated string to an array of trimmed, non-empty IDs
    const ids = e.target.value.split(',')
      .map(id => id.trim())
      .filter(id => id); // Filter out any empty strings that result from trailing commas etc.
    setFormData(prevData => ({ ...prevData, expectedMentees: ids }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.title.trim() || !formData.sessionDate) {
      setError('Session title and date are required.');
      return;
    }

    setLoading(true);
    try {
      // Ensure expectedMentees is an array, even if the input field was cleared manually
      // after being populated by the specialized onChange handler.
      // However, the current setup with handleExpectedMenteesChange should keep it as an array.
      const sessionDataToSubmit = {
        title: formData.title,
        description: formData.description,
        sessionDate: formData.sessionDate,
        expectedMentees: formData.expectedMentees || [], // Send empty array if undefined/null
      };

      const data = await attendanceService.createSession(sessionDataToSubmit);
      setSuccessMessage('Session created successfully! Redirecting...');
      console.log('Created session:', data);
      
      // Clear form (optional if redirecting immediately, but good for UX if delay)
      setFormData({ title: '', description: '', sessionDate: '', expectedMentees: [] });

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/'); // Redirect to home page, or '/dashboard', or a future '/mentor/my-sessions'
      }, 1500); // 1.5-second delay to show success message

    } catch (err) {
      setError(err.message || 'Session creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New Attendance Session</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Session Title:</label>
          <input
            type="text"
            id="title"
            name="title" // Used in general handleChange
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="sessionDate">Session Date:</label>
          <input
            type="date"
            id="sessionDate"
            name="sessionDate" // Used in general handleChange
            value={formData.sessionDate}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="description">Description (Optional):</label>
          <textarea
            id="description"
            name="description" // Used in general handleChange
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
        </div>
        <div>
          <label htmlFor="expectedMenteesInput">Expected Mentee IDs (Optional, comma-separated):</label>
          <input
            type="text"
            id="expectedMenteesInput"
            // This input's value is now controlled by transforming the expectedMentees array for display
            // and its onChange updates the expectedMentees array in formData.
            value={formData.expectedMentees.join(', ')} // Display array as comma-separated string
            placeholder="Paste mentee ID(s), comma-separated"
            onChange={handleExpectedMenteesChange} // Use specialized handler
          />
           <small>If provided, ensure these are mentees assigned to you.</small>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Session'}
        </button>
      </form>
    </div>
  );
};

export default CreateSessionPage;