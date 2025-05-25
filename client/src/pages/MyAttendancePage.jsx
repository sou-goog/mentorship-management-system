// client/src/pages/MyAttendancePage.jsx
import React, { useState, useEffect } from 'react';
import attendanceService from '../api/attendanceService.js'; // Adjust path
import { useAuth } from '../contexts/AuthContext.jsx'; // To get current mentee's ID

const MyAttendancePage = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth(); // Get the logged-in user from context

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user?._id) {
        setError('User not found. Please log in again.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const data = await attendanceService.getMyAttendanceRecords(user._id);
        setAttendanceRecords(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch your attendance records.');
      } finally {
        setLoading(false);
      }
    };

    if (user) { // Only fetch if user is loaded from context
        fetchAttendance();
    } else {
        // Handle case where user context might still be loading or user is not logged in
        // This should ideally be caught by ProtectedRoute, but good to be defensive
        setLoading(false);
        // setError('Authentication details not available.'); // Or redirect
    }
  }, [user]); // Re-fetch if user object changes

  // Basic inline styles
  const tableHeaderStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' };
  const tableCellStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left' };

  if (loading) {
    return <div>Loading your attendance records...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div>
      <h2>My Attendance Records</h2>
      {attendanceRecords.length === 0 ? (
        <p>No attendance records found for you yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Session Title</th>
              <th style={tableHeaderStyle}>Session Date</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Notes from Mentor</th>
              <th style={tableHeaderStyle}>Marked On</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.map((record) => (
              <tr key={record._id}>
                <td style={tableCellStyle}>{record.session?.title || 'N/A'}</td>
                <td style={tableCellStyle}>{record.session ? new Date(record.session.sessionDate).toLocaleDateString() : 'N/A'}</td>
                <td style={tableCellStyle}>{record.status.replace(/_/g, ' ')}</td>
                <td style={tableCellStyle}>{record.notes || '-'}</td>
                <td style={tableCellStyle}>{new Date(record.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyAttendancePage;