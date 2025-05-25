// client/src/pages/MentorMySessionsPage.jsx
import React, { useState, useEffect } from 'react';
import attendanceService from '../api/attendanceService.js'; // Adjust path if needed
import { Link } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext.jsx'; // Not strictly needed if service handles token

const MentorMySessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await attendanceService.getMyCreatedSessions();
        setSessions(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch your created sessions.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Basic inline styles
  const tableHeaderStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' };
  const tableCellStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left' };
  const linkButtonStyle = {
    display: 'inline-block',
    padding: '6px 12px',
    marginBottom: '0',
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.42857143',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    cursor: 'pointer',
    backgroundImage: 'none',
    border: '1px solid transparent',
    borderRadius: '4px',
    color: '#fff',
    backgroundColor: '#5cb85c', // Green
    borderColor: '#4cae4c',
    textDecoration: 'none',
  };


  if (loading) {
    return <div>Loading your sessions...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div>
      <h2>My Created Sessions</h2>
      <Link to="/mentor/create-session" style={{ ...linkButtonStyle, backgroundColor: '#007bff', borderColor: '#007bff', marginBottom: '20px' }}>
        Create New Session
      </Link>
      {sessions.length === 0 ? (
        <p>You have not created any sessions yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Title</th>
              <th style={tableHeaderStyle}>Date</th>
              <th style={tableHeaderStyle}>Description</th>
              <th style={tableHeaderStyle}>Expected Mentees</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session._id}>
                <td style={tableCellStyle}>{session.title}</td>
                <td style={tableCellStyle}>{new Date(session.sessionDate).toLocaleDateString()}</td>
                <td style={tableCellStyle}>{session.description || '-'}</td>
                <td style={tableCellStyle}>{session.expectedMentees?.length || 0}</td>
                <td style={tableCellStyle}>
                  <Link
                    to={`/mentor/session/${session._id}/mark-attendance`} // Link to future marking page
                    style={linkButtonStyle}
                  >
                    View/Mark Attendance
                  </Link>
                  {/* Add Edit/Delete buttons later if needed */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MentorMySessionsPage;