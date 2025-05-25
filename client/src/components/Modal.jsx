// client/src/components/Modal.jsx
import React from 'react';
import './Modal.css'; // We'll create this CSS file next

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent click inside modal from closing it */}
        <div className="modal-header">
          {title && <h3 className="modal-title">{title}</h3>}
          <button onClick={onClose} className="modal-close-button">×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {/* Optional: Add a modal-footer section if needed for action buttons within the modal */}
      </div>
    </div>
  );
};

export default Modal;