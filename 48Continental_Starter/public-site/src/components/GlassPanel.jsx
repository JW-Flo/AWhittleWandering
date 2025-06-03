/**
 * Glass Panel Component
 * 
 * A reusable panel with a glass-like appearance for displaying
 * content in a floating container.
 */

/* eslint-env browser */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Glass Panel component with frosted glass effect
 */
const GlassPanel = ({ id, title, onClose, children, position, className }) => {
  const panelRef = useRef(null);
  
  // Add keyboard support for closing panel with Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // Focus handling for accessibility
  useEffect(() => {
    // Focus the panel when it opens
    if (panelRef.current) {
      panelRef.current.focus();
    }
    
    // Prevent body scrolling when panel is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  // Handle panel position
  const positionStyles = {};
  if (position) {
    if (position.top !== undefined) positionStyles.top = position.top;
    if (position.right !== undefined) positionStyles.right = position.right;
    if (position.bottom !== undefined) positionStyles.bottom = position.bottom;
    if (position.left !== undefined) positionStyles.left = position.left;
  }
  
  return (
    <div
      id={id}
      ref={panelRef}
      className={`glass-panel visible ${className || ''}`}
      style={positionStyles}
      tabIndex="-1"
      aria-modal="true"
      role="dialog"
      aria-labelledby={`${id}-title`}
    >
      <div className="panel-header">
        <h2 id={`${id}-title`}>{title}</h2>
        <button 
          className="close-panel" 
          onClick={onClose}
          aria-label="Close panel"
        >
          ×
        </button>
      </div>
      <div className="panel-content">
        {children}
      </div>
    </div>
  );
};

GlassPanel.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  position: PropTypes.shape({
    top: PropTypes.string,
    right: PropTypes.string,
    bottom: PropTypes.string,
    left: PropTypes.string
  }),
  className: PropTypes.string
};

export default GlassPanel;
