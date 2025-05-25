// client/src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css'; // Your global App styles

// Import Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

// Mentee Pages
import SubmitLeavePage from './pages/SubmitLeavePage';
import MyLeavesPage from './pages/MyLeavesPage';
// import MyAttendancePage from './pages/MyAttendancePage'; // For when Mentee views their attendance

// Mentor Pages
import MentorPendingLeavesPage from './pages/MentorPendingLeavesPage';
import CreateSessionPage from './pages/CreateSessionPage';       // <<< For Attendance
import MentorMySessionsPage from './pages/MentorMySessionsPage'; // <<< For Attendance
import MarkAttendancePage from './pages/MarkAttendancePage'; 
import MyAttendancePage from './pages/MyAttendancePage';
import MentorMenteeUpdatesPage from './pages/MentorMenteeUpdatesPage';
import GuardianViewUpdatesPage from './pages/GuardianViewUpdatesPage';  // <<< For Attendance

// HOD Pages
import HODPendingLeavesPage from './pages/HODPendingLeavesPage';

// Dean Pages
import DeanPendingLeavesPage from './pages/DeanPendingLeavesPage';

// Import Layout/Wrapper Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div>
      <Navbar />
       <div className="app-container"> {/* <<< ADD THIS WRAPPER */}
        <main style={{ padding: '0' }}> {/* Padding might now be on .app-container or handled by main's children */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes - General (any authenticated user can access) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Protected Routes specifically for Mentees */}
          <Route element={<ProtectedRoute allowedRoles={['Mentee']} />}>
            <Route path="/submit-leave" element={<SubmitLeavePage />} />
            <Route path="/my-leaves" element={<MyLeavesPage />} />
           <Route path="/my-attendance" element={<MyAttendancePage />} /> {/* <<< ADD THIS ROUTE */}
          </Route>

          {/* Protected Routes specifically for Mentors */}
          <Route element={<ProtectedRoute allowedRoles={['Mentor']} />}>
            <Route path="/mentor/pending-leaves" element={<MentorPendingLeavesPage />} />
            {/* Attendance Routes for Mentor */}
            <Route path="/mentor/create-session" element={<CreateSessionPage />} />
            <Route path="/mentor/my-sessions" element={<MentorMySessionsPage />} />
            <Route path="/mentor/session/:sessionId/mark-attendance" element={<MarkAttendancePage />} />
            <Route path="/mentor/mentee-updates/:menteeId" element={<MentorMenteeUpdatesPage />} /> {/* <<< NEW ROUTE */}
          </Route>

          {/* Protected Routes specifically for HODs */}
          <Route element={<ProtectedRoute allowedRoles={['HOD']} />}>
            <Route path="/hod/pending-leaves" element={<HODPendingLeavesPage />} />
          </Route>

          {/* Protected Routes specifically for Deans */}
          <Route element={<ProtectedRoute allowedRoles={['Dean']} />}>
            <Route path="/dean/pending-leaves" element={<DeanPendingLeavesPage />} />
          </Route>

          {/* Protected Route specifically for Guardians <<< NEW SECTION */}
          <Route element={<ProtectedRoute allowedRoles={['Guardian']} />}>
            <Route path="/guardian/view-updates" element={<GuardianViewUpdatesPage />} />
            {/* If linking from dashboard with menteeId: <Route path="/guardian/view-updates/:menteeId" element={<GuardianViewUpdatesPage />} /> */}
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
    </div>
  );
}

export default App;