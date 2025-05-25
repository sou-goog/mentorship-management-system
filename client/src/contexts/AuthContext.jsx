// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/authFunctions.js'; // Ensure this path is correct

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('mms_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('mms_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const userData = await authService.login({ email, password });
      if (userData && userData.token) {
        setUser(userData);
        localStorage.setItem('mms_user', JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error('Context Login Error:', error.message); // Log only message
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const newUserData = await authService.register(userData);
      if (newUserData && newUserData.token) {
        setUser(newUserData);
        localStorage.setItem('mms_user', JSON.stringify(newUserData));
        return newUserData;
      }
    } catch (error) {
      console.error('Context Register Error:', error.message); // Log only message
      throw error;
    }
  };

  const logout = () => {
    authService.logout(); // The service function (currently a console.log)
    setUser(null);
    localStorage.removeItem('mms_user');
    // Consider navigation here if needed, e.g., using useNavigate outside of this provider
    // or passing navigate as a prop. For now, components can handle navigation.
    console.log("User logged out from context");
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login, // This is contextLogin in previous examples, renamed for clarity
    logout,
    register, // This is contextRegister in previous examples
  };

  // Render children only after initial loading from localStorage is complete
  if (loading) {
    return <div>Loading application state...</div>; // Or a spinner component
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};