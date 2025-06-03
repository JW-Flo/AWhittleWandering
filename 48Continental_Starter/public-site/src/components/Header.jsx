/**
 * Header Component
 * 
 * Main navigation header for the 48 Continental USA journey website.
 */

/* eslint-env browser */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Header component with navigation
 */
const Header = ({ 
  tripName, 
  currentState, 
  onViewChange,
  activeView
}) => {
  return (
    <header className="hero">
      <div className="header-left">
        <div className="logo">
          <span className="logo-text">The Wandering Whilttle</span>
        </div>
        {tripName && <h2 className="trip-subtitle">{tripName}</h2>}
      </div>
      
      <div className="header-center">
        {currentState && (
          <div className="current-state-pill">
            <span className="state-label">Current State:</span>
            <span className="state-value">{currentState}</span>
          </div>
        )}
      </div>
      
      <nav className="header-nav">
        {[
          { view: 'journey', icon: '📍', label: 'Journey' },
          { view: 'status', icon: '📊', label: 'Status' },
          { view: 'map', icon: '🗺️', label: 'Map' },
          { view: 'gallery', icon: '🖼️', label: 'Gallery' },
          { view: 'comments', icon: '💬', label: 'Comments' },
          { view: 'logs', icon: '📝', label: 'Logs' }
        ].map(({ view, icon, label }) => (
          <button
            key={view}
            className={`nav-button ${activeView === view ? 'active' : ''}`}
            onClick={() => onViewChange(view)}
            aria-pressed={activeView === view}
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-text">{label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
};

Header.propTypes = {
  tripName: PropTypes.string,
  currentState: PropTypes.string,
  onViewChange: PropTypes.func,
  activeView: PropTypes.string
};

// Default props for the Header component
Header.defaultProps = {
  onViewChange: () => {},
  activeView: 'map'
};

export default Header;
