// client/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useAuth } from '../contexts/AuthContext.jsx';
import userService from '../api/userService.js';
import { Link } from 'react-router-dom';
import './DashboardPage.css'; // Ensure this is created and imported

// Simple Card component (can be moved to src/components/ if reused elsewhere)
const DashboardCard = ({ title, children, linkTo, linkText, icon }) => (
  <div className="dashboard-card">
    <div className="card-header">
      {icon && <span className="card-icon">{icon}</span>}
      <h3>{title}</h3>
    </div>
    <div className="card-content">{children}</div>
    {linkTo && linkText && (
      <div className="card-action">
        <Link to={linkTo} className="button-primary button-small"> {/* Added button-small for example */}
          {linkText}
        </Link>
      </div>
    )}
  </div>
);

const DashboardPage = () => {
  const { user, loading: authContextLoading } = useAuth(); // <<< Call useAuth() ONCE at the top level
  
  const [profileData, setProfileData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true); // Renamed from 'loading' to avoid conflict
  const [error, setError] = useState('');

  const fetchProfileDetails = useCallback(async () => {
    // 'user' is now from the component's top-level scope
    if (user && user.token) {
      try {
        setPageLoading(true); // Use pageLoading
        setError('');
        const data = await userService.getMyProfile();
        setProfileData(data);
      } catch (err) {
        setError(err.message || 'Failed to load detailed profile data.');
        console.error("Dashboard profile fetch error:", err);
      } finally {
        setPageLoading(false); // Use pageLoading
      }
    } else {
      setPageLoading(false); // No user to fetch profile for
      // ProtectedRoute should handle redirect if no user and auth is not loading
    }
  }, [user]); // fetchProfileDetails depends on 'user' from context

  useEffect(() => {
    // Only attempt to fetch if authentication is no longer loading
    if (!authContextLoading) {
      if (user && user._id) { // Check if user object from context is available
        fetchProfileDetails();
      } else {
        // Auth context loaded, but no user (logged out or session expired)
        // ProtectedRoute should ideally handle redirection.
        // If user is null here and authContextLoading is false, they are not authenticated.
        setError("User not authenticated. Please log in to view the dashboard.");
        setPageLoading(false);
      }
    }
    // If authContextLoading is true, this effect will re-run when it becomes false.
  }, [user, authContextLoading, fetchProfileDetails]); // <<< Use 'authContextLoading' in dependency array

  // Show loading if either the auth context is loading or the page itself is fetching profile data
  if (authContextLoading || pageLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p style={{marginTop: '10px', color: '#718096'}}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message dashboard-error">Error: {error}</div>;
  }

  // If auth has loaded, and page has loaded, but still no profileData (and no error specific to fetching it)
  // this usually means user is null (not logged in), which ProtectedRoute should handle.
  // But as a fallback:
  if (!profileData && !authContextLoading) {
    return <div className="info-message dashboard-info">User data not available. Please log in.</div>;
  }
  
  // Ensure profileData exists before trying to access its properties
  if (!profileData) {
      return null; // Or a more specific "No profile data" message if needed
  }


  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome to Your Dashboard, {profileData.firstName}!</h1>
        <p className="dashboard-role-info">
          Your Role: <strong>{profileData.role}</strong>
          {profileData.department && <span> | Department: <strong>{profileData.department}</strong></span>}
        </p>
      </header>

      <div className="dashboard-grid">
        <DashboardCard title="My Profile">
          <p><strong>Email:</strong> {profileData.email}</p>
          {/* <Link to="/profile/edit" className="button-outline button-small">Edit Profile</Link> */}
        </DashboardCard>

        {profileData.role === 'Mentee' && (
          <>
            <DashboardCard title="My Leaves" linkTo="/my-leaves" linkText="View & Manage Leaves">
              <p>Check the status of your leave applications or submit a new one.</p>
              {profileData.assignedMentor && (
                <p className="mentor-info">Your Mentor: {profileData.assignedMentor.firstName} {profileData.assignedMentor.lastName}</p>
              )}
            </DashboardCard>
            <DashboardCard title="My Attendance" linkTo="/my-attendance" linkText="View My Attendance">
              <p>Review your attendance records for all sessions.</p>
            </DashboardCard>
            {/* Display linked guardians if populated */}
            {profileData.guardianUserIds && profileData.guardianUserIds.length > 0 && (
                 <DashboardCard title="My Guardians">
                    <p>Your linked guardian(s):</p>
                    <ul>
                        {profileData.guardianUserIds.map(g => <li key={g._id}>{g.firstName} {g.lastName}</li>)}
                    </ul>
                </DashboardCard>
            )}
          </>
        )}

        {profileData.role === 'Mentor' && (
          <>
            <DashboardCard title="Leave Approvals" linkTo="/mentor/pending-leaves" linkText="Review Pending Leaves">
              <p>Act on leave applications from your assigned mentees.</p>
            </DashboardCard>
            <DashboardCard title="Attendance Management" linkTo="/mentor/my-sessions" linkText="Manage Sessions">
              <p>Create sessions and mark mentee attendance.</p>
            </DashboardCard>
            <DashboardCard title="Mentee Updates to Guardians">
              <p>Provide progress updates for your mentees.</p>
              {profileData.assignedMentees && profileData.assignedMentees.length > 0 ? (
                <ul className="mentee-list-dashboard">
                  {profileData.assignedMentees.map(mentee => (
                    <li key={mentee._id}>
                      <Link to={`/mentor/mentee-updates/${mentee._id}`}>
                        Send/View updates for {mentee.firstName} {mentee.lastName}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="info-message">No mentees currently assigned.</p>}
            </DashboardCard>
          </>
        )}
        
        {profileData.role === 'HOD' && (
            <DashboardCard title="HOD Leave Approvals" linkTo="/hod/pending-leaves" linkText="Review Department Leaves">
                <p>Review and act on leave applications from your department.</p>
            </DashboardCard>
        )}

        {profileData.role === 'Dean' && (
            <DashboardCard title="Dean Final Approvals" linkTo="/dean/pending-leaves" linkText="Review Final Leaves">
                <p>Provide final approval or rejection for leave applications.</p>
            </DashboardCard>
        )}

        {profileData.role === 'Guardian' && (
            <DashboardCard title="Mentee Progress Updates" linkTo="/guardian/view-updates" linkText="View Updates">
                <p>Check progress updates for your linked mentee(s).</p>
                {profileData.linkedMenteeIds && profileData.linkedMenteeIds.length > 0 ? (
                     <ul className="mentee-list-dashboard">
                        {profileData.linkedMenteeIds.map(mentee => (
                            <li key={mentee._id}>{mentee.firstName} {mentee.lastName}</li>
                        ))}
                    </ul>
                ) : <p className="info-message">No mentees linked to your account.</p>}
            </DashboardCard>
        )}

        {profileData.role === 'Admin' && (
            <DashboardCard title="System Administration" /* linkTo="/admin/users" linkText="Manage Users" */>
                <p>Admin functionalities will be developed here.</p>
            </DashboardCard>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;