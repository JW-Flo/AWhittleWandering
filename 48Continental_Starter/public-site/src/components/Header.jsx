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
    <header className="app-header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-number">48</span>
          <span className="logo-text">Continental USA</span>
        </div>
        {tripName && <h1 className="trip-title">{tripName}</h1>}
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
        <button 
          className={`nav-button ${activeView === 'map' ? 'active' : ''}`}
          onClick={() => onViewChange('map')}
          aria-pressed={activeView === 'map'}
        >
          <span className="nav-icon">🗺️</span>
          <span className="nav-text">Map</span>
        </button>
        
        <button 
          className={`nav-button ${activeView === 'journey' ? 'active' : ''}`}
          onClick={() => onViewChange('journey')}
          aria-pressed={activeView === 'journey'}
        >
          <span className="nav-icon">📍</span>
          <span className="nav-text">Journey</span>
        </button>
        
        <button 
          className={`nav-button ${activeView === 'states' ? 'active' : ''}`}
          onClick={() => onViewChange('states')}
          aria-pressed={activeView === 'states'}
        >
          <span className="nav-icon">🇺🇸</span>
          <span className="nav-text">States</span>
        </button>
      </nav>
    </header>
  );
};

Header.propTypes = {
  tripName: PropTypes.string,
  currentState: PropTypes.string,
  onViewChange: PropTypes.func.isRequired,
  activeView: PropTypes.string.isRequired
};

export default Header;
