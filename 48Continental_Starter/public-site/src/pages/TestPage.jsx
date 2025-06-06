/**
 * Test Page Component
 * 
 * This page hosts various test components for debugging and diagnosing
 * map rendering and coordinate format issues in The Wandering Whittle application.
 */

/* eslint-env browser */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CoordinateFormatTest from '../components/CoordinateFormatTest';
import MinimalMapTest from '../components/MinimalMapTest';
import './TestPage.css';

const TestPage = () => {
  const [activeTest, setActiveTest] = useState('coordinate');

  return (
    <div className="test-page-container">
      <div className="test-page-header">
        <h1>The Wandering Whittle - Diagnostic Tests</h1>
        <p className="subtitle">Use these tools to diagnose and fix map rendering issues</p>
        <Link to="/" className="back-to-app">Back to Main App</Link>
      </div>

      <div className="test-selector">
        <button
          className={`test-button ${activeTest === 'coordinate' ? 'active' : ''}`}
          onClick={() => setActiveTest('coordinate')}
        >
          Coordinate Format Test
        </button>
        <button
          className={`test-button ${activeTest === 'minimal' ? 'active' : ''}`}
          onClick={() => setActiveTest('minimal')}
        >
          Minimal Map Test
        </button>
        <button
          className={`test-button ${activeTest === 'debug' ? 'active' : ''}`}
          onClick={() => setActiveTest('debug')}
        >
          Map Debug Panel
        </button>
      </div>

      <div className="test-content">
        {activeTest === 'coordinate' && (
          <CoordinateFormatTest />
        )}

        {activeTest === 'minimal' && (
          <MinimalMapTest />
        )}

        {activeTest === 'debug' && (
          <div className="debug-instructions">
            <h2>Map Debug Panel</h2>
            <p>
              The Map Debug Panel can be accessed from the main application by pressing
              <code>Ctrl+Shift+D</code> while viewing the map.
            </p>
            <p>
              It provides detailed information about the current map state, trip data,
              coordinates, and allows various debugging operations.
            </p>

            <Link to="/?debug=true" className="action-button">
              Open Main App with Debug Mode
            </Link>
          </div>
        )}
      </div>

      <div className="test-info">
        <h3>About These Tests</h3>
        <p>
          These diagnostic tools help identify and fix common issues with the map rendering
          and coordinate data processing in The Wandering Whittle application.
        </p>
        <ul>
          <li>
            <strong>Coordinate Format Test:</strong> Verifies coordinate data format compatibility
            with MapBox GL, which requires GeoJSON [longitude, latitude] format.
          </li>
          <li>
            <strong>Minimal Map Test:</strong> A simplified map implementation that isolates rendering
            issues from the rest of the application.
          </li>
          <li>
            <strong>Map Debug Panel:</strong> Provides detailed state information and troubleshooting
            tools for the full map component.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TestPage;
