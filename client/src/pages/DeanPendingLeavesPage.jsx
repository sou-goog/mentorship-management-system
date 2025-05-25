// client/src/pages/DeanPendingLeavesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import leaveService from '../api/leaveService.js';
import Modal from '../components/Modal';
import '../components/Modal.css';

const downloadFile = (filename, content, contentType) => { /* ... Same helper ... */ 
  const element = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
};

const DeanPendingLeavesPage = () => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLeaveDetails, setSelectedLeaveDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [currentLeaveIdForRejection, setCurrentLeaveIdForRejection] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [rejectionModalError, setRejectionModalError] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  const fetchPendingLeaves = useCallback(async (clearMessages = true) => {
    setLoading(true);
    setError('');
    if (clearMessages) setActionMessage({ type: '', text: '' });
    try {
      const data = await leaveService.getDeanPending(); // <<< CHANGED
      setPendingLeaves(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch Dean pending leave applications.'); // <<< CHANGED
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingLeaves(true);
  }, [fetchPendingLeaves]);

  const handleApprove = async (leaveId) => {
    if (!window.confirm('Are you sure you want to give FINAL APPROVAL for this leave (Dean)?')) return; // <<< CHANGED
    setActionMessage({ type: '', text: '' });
    try {
      await leaveService.approveByDean(leaveId); // <<< CHANGED
      setActionMessage({ type: 'success', text: 'Leave finally APPROVED by Dean!' }); // <<< CHANGED
      fetchPendingLeaves(false);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to approve leave as Dean.' }); // <<< CHANGED
    }
  };

  const openRejectionModal = (leaveId) => {
    setCurrentLeaveIdForRejection(leaveId);
    setRejectionReasonText('');
    setRejectionModalError('');
    setIsRejectionModalOpen(true);
  };

  const submitRejectionFromModal = async () => {
    if (!rejectionReasonText.trim()) {
      setRejectionModalError('Rejection reason cannot be empty.');
      return;
    }
    setIsSubmittingRejection(true);
    setRejectionModalError('');
    setActionMessage({ type: '', text: '' });
    try {
      await leaveService.rejectByDean(currentLeaveIdForRejection, rejectionReasonText); // <<< CHANGED
      setActionMessage({ type: 'success', text: 'Leave finally REJECTED by Dean!' }); // <<< CHANGED
      setIsRejectionModalOpen(false);
      fetchPendingLeaves(false);
    } catch (err) {
      setRejectionModalError(err.message || 'Failed to reject leave as Dean.'); // <<< CHANGED
    } finally {
      setIsSubmittingRejection(false);
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
      setActionMessage({ type: 'error', text: `Error fetching details: ${err.message}` });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedLeaveDetails(null);
  };

  const handleDownloadLeave = () => { /* ... Same as Mentor/HOD Page ... */ 
    if (!selectedLeaveDetails) return;
    let fileContent = `Leave Application Details...\n`;
    fileContent += `Mentee Name: ${selectedLeaveDetails.mentee?.firstName} ${selectedLeaveDetails.mentee?.lastName}\n`;
    fileContent += `Mentee Email: ${selectedLeaveDetails.mentee?.email}\n`;
    fileContent += `Department: ${selectedLeaveDetails.mentee?.department || 'N/A'}\n\n`;
    fileContent += `Start Date: ${new Date(selectedLeaveDetails.startDate).toLocaleDateString()}\n`;
    fileContent += `End Date: ${new Date(selectedLeaveDetails.endDate).toLocaleDateString()}\n`;
    fileContent += `Leave Type: ${selectedLeaveDetails.leaveType}\n`;
    fileContent += `Reason: ${selectedLeaveDetails.reason}\n\n`;
    fileContent += `Status: ${selectedLeaveDetails.status.replace(/_/g, ' ')}\n`;
    if (selectedLeaveDetails.rejectionReason) {
      fileContent += `Rejection Reason: ${selectedLeaveDetails.rejectionReason}\n`;
    }
    fileContent += `Submitted On: ${new Date(selectedLeaveDetails.createdAt).toLocaleString()}\n`;
    fileContent += `Last Updated: ${new Date(selectedLeaveDetails.updatedAt).toLocaleString()}\n\n`;
    if (selectedLeaveDetails.supportingDocuments && selectedLeaveDetails.supportingDocuments.length > 0) {
      fileContent += `Supporting Documents:\n`;
      selectedLeaveDetails.supportingDocuments.forEach(doc => {
        fileContent += `- ${doc.originalName} (Server Filename: ${doc.filePath})\n`;
      });
    } else {
      fileContent += `Supporting Documents: None\n`;
    }
    const menteeLastName = selectedLeaveDetails.mentee?.lastName || 'Mentee';
    const submissionDate = new Date(selectedLeaveDetails.createdAt).toISOString().split('T')[0];
    const filename = `LeaveApp_${menteeLastName}_${submissionDate}.txt`;
    downloadFile(filename, fileContent, 'text/plain;charset=utf-8;');
  };

  if (loading && pendingLeaves.length === 0) return <div>Loading Dean pending leave applications...</div>; // <<< CHANGED
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div>
      <h2>Leaves Pending Your (Dean) Final Approval</h2> {/* <<< CHANGED */}
      {actionMessage.text && <p className={actionMessage.type === 'success' ? 'success-message' : 'error-message'}>{actionMessage.text}</p>}
      {pendingLeaves.length === 0 && !loading ? <p className="info-message">No leave applications pending your final Dean approval.</p> : ( // <<< CHANGED
        <table>
          <thead>
            <tr>
              <th>Mentee Name</th><th>Mentee Email</th><th>Mentee Dept</th><th>Start Date</th><th>End Date</th><th>Type</th><th>Reason</th><th>Submitted</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingLeaves.map(leave => (
              <tr key={leave._id}>
                <td>{leave.mentee?.firstName} {leave.mentee?.lastName}</td>
                <td>{leave.mentee?.email}</td>
                <td>{leave.mentee?.department}</td>
                <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                <td>{leave.leaveType}</td>
                <td title={leave.reason}>{leave.reason.length > 30 ? `${leave.reason.substring(0, 30)}...` : leave.reason}</td>
                <td>{new Date(leave.createdAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleApprove(leave._id)} className="approve-button">Approve (Final)</button> {/* <<< CHANGED */}
                  <button onClick={() => openRejectionModal(leave._id)} className="reject-button">Reject (Final)</button> {/* <<< CHANGED */}
                  <button onClick={() => handleViewDetails(leave._id)} className="view-button" style={{ marginLeft: '5px' }}>Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal isOpen={isDetailModalOpen} onClose={closeDetailModal} title="Leave Application Details">
        {/* ... Identical Modal Content as Mentor/HOD Page ... */}
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
              {selectedLeaveDetails.rejectionReason && (<><dt>Rejection Reason:</dt><dd>{selectedLeaveDetails.rejectionReason}</dd></>)}
              <dt>Submitted On:</dt><dd>{new Date(selectedLeaveDetails.createdAt).toLocaleString()}</dd>
              <dt>Last Updated:</dt><dd>{new Date(selectedLeaveDetails.updatedAt).toLocaleString()}</dd>
              {selectedLeaveDetails.supportingDocuments && selectedLeaveDetails.supportingDocuments.length > 0 && (<><dt>Supporting Documents:</dt><dd><ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>{selectedLeaveDetails.supportingDocuments.map((doc, index) => (<li key={doc.filePath || index}><a href={`http://localhost:5001/uploads/${doc.filePath}`} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>{doc.originalName || `Document ${index + 1}`}</a></li>))}</ul></dd></>)}
            </dl>
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', textAlign: 'right' }}>
              <button onClick={handleDownloadLeave} className="button-primary">Download as TXT</button>
              <button onClick={closeDetailModal} style={{ marginLeft: '10px' }} className="cancel-button">Close</button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={isRejectionModalOpen} onClose={() => {setIsRejectionModalOpen(false); setRejectionModalError('');}} title="Provide Final Rejection Reason (Dean)"> {/* <<< CHANGED */}
        <div>
          {rejectionModalError && <p className="error-message" style={{fontSize: '0.9em', marginBottom: '10px'}}>{rejectionModalError}</p>}
          <textarea rows="4" style={{ width: '95%', display:'block', marginBottom: '10px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} value={rejectionReasonText} onChange={(e) => { setRejectionReasonText(e.target.value); if (rejectionModalError) setRejectionModalError(''); }} placeholder="Enter reason for final rejection..." required />
          <button onClick={submitRejectionFromModal} className="reject-button" disabled={isSubmittingRejection}>{isSubmittingRejection ? 'Submitting...' : 'Confirm Final Rejection'}</button> {/* <<< CHANGED */}
          <button onClick={() => {setIsRejectionModalOpen(false); setRejectionModalError('');}} style={{ marginLeft: '10px' }} className="cancel-button">Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default DeanPendingLeavesPage;