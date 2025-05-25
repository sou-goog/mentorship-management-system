// client/src/components/Navbar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // Changed Link to NavLink
import { useAuth } from '../contexts/AuthContext.jsx';
import './Navbar.css'; // <<< IMPORT THE CSS FILE

// Import icons (same as before)
import {
  FaHome, FaTachometerAlt, FaSignInAlt, FaUserPlus, FaSignOutAlt,
  FaFileMedicalAlt, FaListUl, FaCalendarCheck,
  FaChalkboardTeacher, FaUserEdit, FaTasks,
  FaUserShield, FaUsersCog
} from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Function to determine class for NavLink (active vs. not active)
  // NavLink by default adds an 'active' class, so we can target that with CSS
  // Or we can use a function for the `className` prop if more complex logic is needed.
  // For this CSS, NavLink's default 'active' class on the link itself is sufficient.

  return (
    <nav id="main-navbar"> {/* Use ID for targeting with Navbar.css */}
      <ul className="nav-left"> {/* Class for left-aligned items */}
        <li>
          <NavLink to="/" className="nav-link" end> {/* Use NavLink and 'end' prop for home */}
            <FaHome size="1.1em" /> Home
          </NavLink>
        </li>
        {isAuthenticated && (
          <>
            <li>
              <NavLink to="/dashboard" className="nav-link">
                <FaTachometerAlt size="1.1em" /> Dashboard
              </NavLink>
            </li>

            {/* Mentee specific links */}
            {user && user.role === 'Mentee' && (
              <>
                <li><NavLink to="/submit-leave" className="nav-link"><FaFileMedicalAlt size="1.1em" /> Submit Leave</NavLink></li>
                <li><NavLink to="/my-leaves" className="nav-link"><FaListUl size="1.1em" /> My Leaves</NavLink></li>
                <li><NavLink to="/my-attendance" className="nav-link"><FaCalendarCheck size="1.1em" /> My Attendance</NavLink></li>
              </>
            )}

            {/* Mentor specific links */}
            {user && user.role === 'Mentor' && (
              <>
                <li><NavLink to="/mentor/pending-leaves" className="nav-link"><FaTasks size="1.1em" /> Leave Approvals</NavLink></li>
                <li><NavLink to="/mentor/create-session" className="nav-link"><FaUserEdit size="1.1em" /> Create Session</NavLink></li>
                <li>
  <NavLink to="/mentor/my-sessions" className="nav-link">
    <FaChalkboardTeacher size="1.1em" /> My Sessions
  </NavLink>
</li>
              </>
            )}

            {/* HOD specific links */}
            {user && user.role === 'HOD' && (
              <li><NavLink to="/hod/pending-leaves" className="nav-link"><FaUsersCog size="1.1em" /> HOD Approvals</NavLink></li>
            )}

            {/* Dean specific links */}
            {user && user.role === 'Dean' && (
              <li><NavLink to="/dean/pending-leaves" className="nav-link"><FaUsersCog size="1.1em" /> Dean Approvals</NavLink></li>
            )}

            {/* Guardian specific links */}
            {user && user.role === 'Guardian' && (
              <li><NavLink to="/guardian/view-updates" className="nav-link"><FaUserShield size="1.1em" /> Mentee Updates</NavLink></li>
            )}
          </>
        )}
      </ul>

      <ul className="nav-right"> {/* Class for right-aligned items */}
        {isAuthenticated ? (
          <>
            {user && <li className="welcome-message">Welcome, {user.firstName || user.email}! ({user.role})</li>}
            <li>
              <button onClick={handleLogout} className="nav-button-link"> {/* Use class for button */}
                <FaSignOutAlt size="1.1em" /> Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li><NavLink to="/login" className="nav-link"><FaSignInAlt size="1.1em" /> Login</NavLink></li>
            <li><NavLink to="/register" className="nav-link"><FaUserPlus size="1.1em" /> Register</NavLink></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;