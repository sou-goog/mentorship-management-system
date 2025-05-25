// client/src/pages/SubmitLeavePage.jsx
import React, { useState } from 'react';
import leaveService from '../api/leaveService.js'; // Adjust if your path is different
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner'; // Import the Spinner component
import { FaPaperPlane } from 'react-icons/fa'; // Optional: if you want an icon on the button

const SubmitLeavePage = () => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: '',
    reason: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed 'loading' to 'isSubmitting' for clarity
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const { startDate, endDate, leaveType, reason } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Client-side validation
    if (!formData.startDate || !formData.endDate || !formData.leaveType.trim() || !formData.reason.trim()) {
      setError('All fields (except documents) are required. Please fill out Start Date, End Date, Leave Type, and Reason.');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date cannot be before start date.');
      return;
    }

    setIsSubmitting(true); // Set loading true before API call
    try {
      const leaveDataPayload = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        leaveType: formData.leaveType,
        reason: formData.reason,
      };

      await leaveService.submitLeave(leaveDataPayload, selectedFiles);
      
      setSuccessMessage('Leave application submitted successfully! Redirecting to My Leaves...');
      
      setFormData({ startDate: '', endDate: '', leaveType: '', reason: '' });
      setSelectedFiles([]);
      const fileInput = document.getElementById('supportingDocuments');
      if (fileInput) {
        fileInput.value = null;
      }

      setTimeout(() => {
        navigate('/my-leaves');
      }, 2000);

    } catch (err) {
      setError(err.message || 'Leave submission failed. Please try again.');
      console.error("Leave Submission Error:", err);
    } finally {
      setIsSubmitting(false); // Set loading false in finally block
    }
  };

  return (
    <div className="card"> {/* Assuming .card class provides padding and styling */}
      <h2>Submit New Leave Application</h2>
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
      
      <form onSubmit={handleSubmit}> {/* Assuming form styles are global in App.css */}
        <div className="form-group"> {/* Add form-group class for styling label+input pairs */}
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={startDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={endDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="leaveType">Leave Type:</label>
          <input
            type="text"
            id="leaveType"
            name="leaveType"
            value={leaveType}
            onChange={handleChange}
            placeholder="e.g., Vacation, Medical"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="reason">Reason:</label>
          <textarea
            id="reason"
            name="reason"
            value={reason}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="supportingDocuments">Supporting Documents (Optional):</label>
          <input
            type="file"
            id="supportingDocuments"
            name="supportingDocuments"
            onChange={handleFileChange}
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          />
          {selectedFiles.length > 0 && (
            <div style={{marginTop: '10px'}}>
              <strong>Selected files:</strong>
              <ul className="selected-files-list"> {/* Assuming you have a style for this */}
                {selectedFiles.map((file, index) => (
                  <li key={index}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button type="submit" disabled={isSubmitting} className="button-primary">
          {isSubmitting ? (
            <>
              <Spinner size="sm" color="#fff" /> {/* White spinner for dark button background */}
              Submitting...
            </>
          ) : (
            <>
              <FaPaperPlane style={{ marginRight: '8px' }} /> Submit Application
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SubmitLeavePage;