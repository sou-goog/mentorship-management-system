// client/src/pages/MarkAttendancePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // useNavigate is used for redirection
import attendanceService from '../api/attendanceService.js'; // Adjust if your path/filename is different

const MarkAttendancePage = () => {
  const { sessionId } = useParams();
  //const navigate = useNavigate(); // Keep for potential future use or if you reinstate auto-redirect

  const [session, setSession] = useState(null);
  const [menteesForAttendance, setMenteesForAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // For errors during data loading
  const [submitInProgress, setSubmitInProgress] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' }); // For success/error of submit action

  const attendanceStatuses = ['Present', 'Absent', 'Late', 'Excused'];

  const loadAttendanceData = useCallback(async (clearActionMessages = false) => {
    setLoading(true);
    setError('');
    if (clearActionMessages) {
      setSubmitMessage({ type: '', text: '' }); // Clear previous submit messages only when explicitly told
    }
    try {
      console.log('[FRONTEND DEBUG] MarkAttendancePage: Fetching session by ID:', sessionId);
      const sessionData = await attendanceService.getSessionById(sessionId);
      console.log('[FRONTEND DEBUG] MarkAttendancePage: Raw sessionData from service:', JSON.parse(JSON.stringify(sessionData)));
      setSession(sessionData);

      let menteesToDisplay = [];
      if (sessionData && sessionData.expectedMentees && sessionData.expectedMentees.length > 0) {
        menteesToDisplay = sessionData.expectedMentees.map(mentee => ({
          _id: mentee._id,
          firstName: mentee.firstName,
          lastName: mentee.lastName,
          isOnApprovedLeave: mentee.isOnApprovedLeave,
          currentStatus: mentee.isOnApprovedLeave ? 'On_Approved_Leave' : '',
          notes: '',
        }));
      } else {
        console.warn("[FRONTEND DEBUG] MarkAttendancePage: Session has no expectedMentees or they were not populated.");
      }
      
      console.log('[FRONTEND DEBUG] MarkAttendancePage: Fetching existing attendance records for session:', sessionId);
      const existingRecords = await attendanceService.getAttendanceForSession(sessionId);
      console.log('[FRONTEND DEBUG] MarkAttendancePage: Raw existingRecords from service:', JSON.parse(JSON.stringify(existingRecords)));
      
      if (menteesToDisplay.length > 0 && existingRecords.length > 0) {
        menteesToDisplay = menteesToDisplay.map(mentee => {
          const record = existingRecords.find(r => r.mentee._id === mentee._id);
          // If backend determined isOnApprovedLeave, that's the initial truth.
          // currentStatus will be pre-filled to 'On_Approved_Leave'.
          // If an existing record has a different status, but mentee.isOnApprovedLeave is true,
          // the initial display still respects isOnApprovedLeave.
          // When merging, if isOnApprovedLeave is true, status remains On_Approved_Leave.
          // Otherwise, use existing record's status.
          if (mentee.isOnApprovedLeave) {
            return { ...mentee, currentStatus: 'On_Approved_Leave', notes: record ? record.notes || '' : '' };
          }
          return record ? { ...mentee, currentStatus: record.status, notes: record.notes || '' } : mentee;
        });
      } else if (existingRecords.length > 0 && menteesToDisplay.length === 0) {
        // This case: session has no expectedMentees defined in its own doc, but records exist.
        // This might happen if expectedMentees wasn't set on session creation.
        menteesToDisplay = existingRecords.map(record => ({
            _id: record.mentee._id,
            firstName: record.mentee.firstName, // Assumes mentee is populated on record
            lastName: record.mentee.lastName,
            isOnApprovedLeave: record.status === 'On_Approved_Leave', // Infer from existing record
            currentStatus: record.status,
            notes: record.notes || ''
        }));
      }
      console.log('[FRONTEND DEBUG] MarkAttendancePage: Final menteesForAttendance to be set:', JSON.parse(JSON.stringify(menteesToDisplay)));
      setMenteesForAttendance(menteesToDisplay);

    } catch (err) {
      setError(err.message || 'Failed to load session or attendance data.');
      console.error("Error in loadAttendanceData:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]); // sessionId is a dependency

  useEffect(() => {
    if (sessionId) {
      loadAttendanceData(true); // Clear previous action messages on initial load or session change
    }
  }, [sessionId, loadAttendanceData]); // Add loadAttendanceData to dependency array as it's defined with useCallback

  const handleStatusChange = (menteeId, newStatus) => {
    setMenteesForAttendance(prevMentees =>
      prevMentees.map(mentee =>
        mentee._id === menteeId ? { ...mentee, currentStatus: newStatus } : mentee
      )
    );
  };

  const handleNotesChange = (menteeId, newNotes) => {
    setMenteesForAttendance(prevMentees =>
      prevMentees.map(mentee =>
        mentee._id === menteeId ? { ...mentee, notes: newNotes } : mentee
      )
    );
  };

  const handleSubmitAttendance = async () => {
    setSubmitInProgress(true);
    setSubmitMessage({ type: '', text: '' }); // Clear previous submit message before new attempt

    const refinedAttendanceDataPayload = menteesForAttendance
      .filter(mentee => mentee.currentStatus) // Only include if a status is actually set by user or pre-fill
      .map(mentee => ({
        menteeId: mentee._id,
        status: mentee.currentStatus, // This will be 'On_Approved_Leave' if pre-filled and not changed
        notes: mentee.notes,
      }));
    console.log('[MarkAttendancePage] Submitting attendanceDataPayload:', refinedAttendanceDataPayload);

    if (refinedAttendanceDataPayload.length === 0) {
        setSubmitMessage({ type: 'info', text: 'No attendance data selected to submit.' });
        setSubmitInProgress(false);
        return;
    }
    try {
      const response = await attendanceService.markAttendance(sessionId, refinedAttendanceDataPayload);
      setSubmitMessage({ type: 'success', text: response.message || 'Attendance submitted successfully!' });
      // Re-fetch data to show the latest state (including any backend overrides for 'On_Approved_Leave')
      // Pass false so it doesn't clear the success message we just set.
      loadAttendanceData(false);
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.message || 'Failed to submit attendance.' });
    } finally {
      setSubmitInProgress(false);
    }
  };

  // Basic inline styles (Consider moving to App.css or a dedicated CSS file/module)
  const tableHeaderStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2', fontWeight: 'bold' };
  const tableCellStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left' };
  const buttonStyle = { marginTop: '20px', padding: '10px 15px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' };
  const disabledButtonStyle = { ...buttonStyle, backgroundColor: '#ccc', cursor: 'not-allowed' };
  const messageStyle = (type) => ({
    color: type === 'success' ? 'green' : 'red',
    border: `1px solid ${type === 'success' ? 'green' : 'red'}`,
    backgroundColor: type === 'success' ? '#e6ffe6' : '#ffe6e6',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '4px',
    display: 'flex', // For aligning message and link
    justifyContent: 'space-between',
    alignItems: 'center',
  });
  const linkStyle = { textDecoration: 'underline', marginLeft: '20px', color: '#007bff', cursor: 'pointer' };


  if (loading && !session) return <div>Loading attendance data for session...</div>;
  if (error) return <div style={{ color: 'red' }}>Error loading session data: {error}</div>;
  if (!session) return <div>Session not found or data is incomplete. Please ensure the session ID is correct or go back and select a session.</div>;

  return (
    <div>
      <h2>Mark Attendance for: {session.title}</h2>
      <p>Date: {new Date(session.sessionDate).toLocaleDateString()}</p>
      
      {submitMessage && submitMessage.text && (
         <div style={messageStyle(submitMessage.type)}>
           <span>{submitMessage.text}</span>
           {submitMessage.type === 'success' && (
             <Link to="/mentor/my-sessions" style={linkStyle}>
               Back to My Sessions
             </Link>
           )}
         </div>
      )}

      {menteesForAttendance.length === 0 ? (
        <p>No mentees listed for this session. Please ensure expected mentees were added when the session was created.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Mentee Name</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {menteesForAttendance.map(mentee => {
                console.log(`[MarkAttendancePage] RENDERING MENTEE IN JSX: ${mentee.firstName} ${mentee.lastName}, ID: ${mentee._id}, isOnApprovedLeave: ${mentee.isOnApprovedLeave}, currentStatus: ${mentee.currentStatus}`);
                return (
                  <tr key={mentee._id}>
                    <td style={tableCellStyle}>{mentee.firstName} {mentee.lastName} {mentee.isOnApprovedLeave === true && <em style={{color: 'blue', marginLeft: '5px'}}>(On Approved Leave)</em>}</td>
                    <td style={tableCellStyle}>
                      {mentee.isOnApprovedLeave === true ? (
                        <span>On Approved Leave</span>
                      ) : (
                        <select
                          value={mentee.currentStatus || ''}
                          onChange={(e) => handleStatusChange(mentee._id, e.target.value)}
                        >
                          <option value="">Select Status</option>
                          {attendanceStatuses.map(status => (
                            <option key={status} value={status}>{status.replace('_', ' ')}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td style={tableCellStyle}>
                      <input
                        type="text"
                        value={mentee.notes || ''}
                        onChange={(e) => handleNotesChange(mentee._id, e.target.value)}
                        placeholder="Optional notes"
                        disabled={mentee.isOnApprovedLeave === true}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button 
            onClick={handleSubmitAttendance} 
            disabled={submitInProgress || (loading && !submitInProgress)} // Disable if main loading is happening unless a submit is already in progress
            style={submitInProgress || (loading && !submitInProgress) ? disabledButtonStyle : buttonStyle}
          >
            {submitInProgress ? 'Submitting...' : 'Save Attendance'}
          </button>
        </>
      )}
    </div>
  );
};

export default MarkAttendancePage;