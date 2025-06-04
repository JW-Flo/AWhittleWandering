/**
 * Header Component
 * 
 * Main navigation header for The Wandering Whittle journey website.
 * Styled with a modern dark theme UI for better user experience.
 */

/* eslint-env browser */
import React from 'react';
import PropTypes from 'prop-types';
import { FaRoute, FaChartBar, FaMapMarkedAlt } from 'react-icons/fa';

/**
 * Header component with navigation
 */
const Header = ({ 
  currentState, 
  onViewChange,
  activeView
}) => {
  return (
    <header className="dashboard-header">
      <div className="logo">
        <img src="/wandering-whittle-logo.png" alt="The Wandering Whittle Logo" />
        <span className="logo-text">The Wandering Whittle</span>
      </div>
      
      {currentState && (
        <div className="current-state-pill">
          <span className="state-label">Current State:</span>
          <span className="state-value">{currentState}</span>
        </div>
      )}
      
      <div className="header-tabs">
        <div 
          className={`header-tab ${activeView === 'map' ? 'active' : ''}`} 
          onClick={() => onViewChange('map')}
          role="button"
          tabIndex={0}
          aria-pressed={activeView === 'map'}
        >
          <FaMapMarkedAlt style={{ marginRight: '8px' }} />
          Live Map
        </div>
        
        <div 
          className={`header-tab ${activeView === 'journey' ? 'active' : ''}`} 
          onClick={() => onViewChange('journey')}
          role="button"
          tabIndex={0}
          aria-pressed={activeView === 'journey'}
        >
          <FaRoute style={{ marginRight: '8px' }} />
          Road Trip
        </div>
        
        <div 
          className={`header-tab ${activeView === 'states' ? 'active' : ''}`} 
          onClick={() => onViewChange('states')}
          role="button"
          tabIndex={0}
          aria-pressed={activeView === 'states'}
        >
          <FaChartBar style={{ marginRight: '8px' }} />
          48 States
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
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
