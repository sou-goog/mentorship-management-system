// client/src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import './HomePage.css'; // We'll create this for specific HomePage styles

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page-container">
      <header className="home-hero">
        <h1>Welcome to the Mentorship Management System</h1>
        <p className="home-subtitle">
          Streamlining mentorship, attendance, leave, and communication for a better experience.
        </p>
        {!isAuthenticated && (
          <div className="home-cta-buttons">
            <Link to="/login" className="button-primary home-button">Login</Link>
            <Link to="/register" className="button-secondary home-button">Register</Link>
          </div>
        )}
      </header>

      <section className="home-features">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"> {/* Placeholder for icon */}
              <span>📅</span>
            </div>
            <h3>Leave Management</h3>
            <p>Efficiently manage leave applications with a multi-stage approval workflow.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"> {/* Placeholder for icon */}
              <span>✅</span>
            </div>
            <h3>Attendance Tracking</h3>
            <p>Mentors can easily create sessions and mark mentee attendance.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"> {/* Placeholder for icon */}
              <span>👥</span>
            </div>
            <h3>Guardian Updates</h3>
            <p>Keep guardians informed with progress updates from mentors.</p>
          </div>
          {/* Add more feature cards if you have other key modules */}
        </div>
      </section>

      {isAuthenticated && user && (
        <section className="home-user-actions">
          <h2>Quick Actions for {user.firstName}</h2>
          <div className="action-links">
            <Link to="/dashboard" className="button-outline">Go to My Dashboard</Link>
            {user.role === 'Mentee' && <Link to="/submit-leave" className="button-outline">Submit New Leave</Link>}
            {user.role === 'Mentor' && <Link to="/mentor/create-session" className="button-outline">Create New Session</Link>}
            {/* Add more role-specific quick links */}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;