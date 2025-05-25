// client/src/components/Spinner.jsx
import React from 'react';
// You can create a Spinner.css or use inline styles for simplicity here
// For now, let's assume the .spinner class from App.css can be adapted with props

const Spinner = ({ size = 'sm', color = '#fff' }) => { // default to small, white (for dark buttons)
  const spinnerStyle = {
    display: 'inline-block', // Important for use inside buttons
    border: '2px solid rgba(0, 0, 0, 0.2)', // Lighter track for inline
    width: size === 'sm' ? '16px' : '24px', // sm or md
    height: size === 'sm' ? '16px' : '24px',
    borderRadius: '50%',
    borderLeftColor: color, // Spinner color
    animation: 'spin 0.6s ease infinite',
    marginRight: size === 'sm' ? '8px' : '10px', // Space before button text
  };

  // Re-declare keyframes here if Spinner.css is not used or if it's a module.
  // Better to have @keyframes spin in a global CSS like App.css if used widely.
  // We already have @keyframes spin in App.css

  return <div style={spinnerStyle}></div>;
};

export default Spinner;