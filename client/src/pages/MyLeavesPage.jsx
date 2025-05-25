// client/src/pages/MyLeavesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import leaveService from '../api/leaveService.js';
import Modal from '../components/Modal';
import '../components/Modal.css';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';

// Helper function to trigger file download from a Blob
const downloadBlob = (filename, blob) => {
  const element = document.createElement('a');
  element.href = URL.createObjectURL(blob);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
};

const MyLeavesPage = () => {
  const { user, loading: authContextLoading } = useAuth(); // Get user and auth context loading state

  const [leaves, setLeaves] = useState([]);
  const [pageLoading, setPageLoading] = useState(true); // Specific loading for this page's data
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLeaveDetails, setSelectedLeaveDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const fetchLeaves = useCallback(async (clearMessages = true) => {
    if (!user || !user._id) { // Ensure user object from context is valid
      // This case should ideally be handled by ProtectedRoute redirecting,
      // but a defensive check is good.
      setPageLoading(false); // Stop page loading if no user
      return;
    }
    setPageLoading(true);
    setError('');
    if (clearMessages) setActionMessage({ type: '', text: '' });
    try {
      const data = await leaveService.getMyLeaves();
      setLeaves(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch leave applications.');
      console.error("Error fetching leaves:", err);
    } finally {
      setPageLoading(false);
    }
  }, [user]); // Depends on user from context

  useEffect(() => {
    // Only attempt to fetch leaves if auth context is done loading AND user is present
    if (!authContextLoading && user && user._id) {
      fetchLeaves(true);
    } else if (!authContextLoading && !user) {
      // Auth context loaded, but no user (logged out or session expired)
      setError("Please log in to view your leaves.");
      setPageLoading(false);
    }
    // If authContextLoading is true, we wait for it to resolve
  }, [user, authContextLoading, fetchLeaves]);

  const handleWithdraw = async (leaveId) => {
    if (!window.confirm('Are you sure you want to withdraw this leave application?')) return;
    setActionMessage({ type: '', text: '' });
    try {
      await leaveService.withdrawLeave(leaveId);
      setActionMessage({ type: 'success', text: 'Leave application withdrawn successfully!' });
      fetchLeaves(false);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to withdraw leave application.' });
    }
  };

  const handleViewDetails = async (leaveId) => {
    setDetailLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      const details = await leaveService.getLeaveApplicationById(leaveId);
      setSelectedLeaveDetails(details);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch leave details:', err);
      setActionMessage({ type: 'error', text: `Error fetching details: ${err.message}` });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => { // Corrected and used
    setIsDetailModalOpen(false);
    setSelectedLeaveDetails(null);
  };

  const handleDownloadPDF = async () => {
    if (!selectedLeaveDetails || !selectedLeaveDetails._id) {
      alert('Leave details not available for download.');
      return;
    }
    if (!user || !user.token) {
      setActionMessage({ type: 'error', text: 'Authentication error. Please log in again.' });
      return;
    }
    setIsDownloadingPDF(true);
    setActionMessage({ type: '', text: '' });
    try {
      const token = user.token;
      const response = await axios.get(
        `http://localhost:5001/api/leaves/${selectedLeaveDetails._id}/download-pdf`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );
      const contentDisposition = response.headers['content-disposition'];
      let filename = `LeaveApplication_${selectedLeaveDetails.mentee?.lastName || 'Mentee'}_${selectedLeaveDetails._id.substring(0, 8)}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) filename = filenameMatch[1];
      }
      downloadBlob(filename, response.data);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setActionMessage({ type: 'error', text: err.message || 'Could not download PDF.' });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const withdrawableStatuses = ['Pending_Mentor', 'Pending_HOD', 'Pending_Dean'];

  // Show loading if auth context is loading OR if page data is loading AND no user is set yet (initial state)
   if (authContextLoading || pageLoading) { // Check both auth context and page-specific loading
    return (
      <div className="spinner-container"> {/* Use the centering container */}
        <div className="spinner"></div>
      </div>
    );
  }
  if (error && !pageLoading) { // Show error only if not actively page loading
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div>
      <h2>My Leave Applications</h2>
      {actionMessage.text && (<p className={actionMessage.type === 'success' ? 'success-message' : 'error-message'}>{actionMessage.text}</p>)}
      {!pageLoading && leaves.length === 0 && !error && (<p className="info-message">You have not submitted any leave applications yet.</p>)}
      {!pageLoading && leaves.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Start Date</th><th>End Date</th><th>Type</th><th>Reason</th><th>Status</th><th>Submitted On</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave._id}>
                <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                <td>{leave.leaveType}</td>
                <td title={leave.reason}>{leave.reason.length > 30 ? `${leave.reason.substring(0, 30)}...` : leave.reason}</td>
                <td>{leave.status.replace(/_/g, ' ')}</td>
                <td>{new Date(leave.createdAt).toLocaleDateString()}</td>
                <td>
                  {withdrawableStatuses.includes(leave.status) && (<button onClick={() => handleWithdraw(leave._id)} className="withdraw-button">Withdraw</button>)}
                  <button onClick={() => handleViewDetails(leave._id)} className="view-button" style={{ marginLeft: withdrawableStatuses.includes(leave.status) ? '5px' : '0' }}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal isOpen={isDetailModalOpen} onClose={closeDetailModal} title="Leave Application Details">
        {detailLoading && <p>Loading details...</p>}
        {selectedLeaveDetails && !detailLoading && (
          <>
            <dl className="detail-grid">
              <dt>Mentee:</dt><dd>{selectedLeaveDetails.mentee?.firstName} {selectedLeaveDetails.mentee?.lastName} ({selectedLeaveDetails.mentee?.email})</dd>
              <dt>Department:</dt><dd>{selectedLeaveDetails.mentee?.department || 'N/A'}</dd>
              <dt>Start Date:</dt><dd>{new Date(selectedLeaveDetails.startDate).toLocaleDateString()}</dd>
              <dt>End Date:</dt><dd>{new Date(selectedLeaveDetails.endDate).toLocaleDateString()}</dd>
              <dt>Leave Type:</dt><dd>{selectedLeaveDetails.leaveType}</dd>
              <dt>Reason:</dt><dd>{selectedLeaveDetails.reason}</dd>
              <dt>Status:</dt><dd>{selectedLeaveDetails.status.replace(/_/g, ' ')}</dd>
              {selectedLeaveDetails.rejectionReason && (<> <dt>Rejection Reason:</dt> <dd>{selectedLeaveDetails.rejectionReason}</dd> </>)}
              <dt>Submitted On:</dt><dd>{new Date(selectedLeaveDetails.createdAt).toLocaleString()}</dd>
              <dt>Last Updated:</dt><dd>{new Date(selectedLeaveDetails.updatedAt).toLocaleString()}</dd>
              {selectedLeaveDetails.supportingDocuments && selectedLeaveDetails.supportingDocuments.length > 0 && (
                <>
                  <dt>Supporting Documents:</dt>
                  <dd>
                    <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
                      {selectedLeaveDetails.supportingDocuments.map((doc, index) => (
                        <li key={doc.filePath || index}>
                          <a href={`http://localhost:5001/uploads/${doc.filePath}`} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>
                            {doc.originalName || `Document ${index + 1}`}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </>
              )}
            </dl>
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', textAlign: 'right' }}>
              <button onClick={handleDownloadPDF} className="button-primary" disabled={isDownloadingPDF}>
                {isDownloadingPDF ? 'Downloading...' : 'Download as PDF'}
              </button>
              <button onClick={closeDetailModal} style={{ marginLeft: '10px' }} className="cancel-button">Close</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default MyLeavesPage;