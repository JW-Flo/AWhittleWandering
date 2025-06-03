/**
 * State Collection Component
 * 
 * Displays a grid of states visited during the 48 Continental USA journey,
 * with visual indicators for visited and unvisited states.
 */

/* eslint-env browser */
import React from 'react';
import PropTypes from 'prop-types';

// List of all 48 continental US states with abbreviations
const CONTINENTAL_STATES = [
  { abbr: 'AL', name: 'Alabama' },
  { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' },
  { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' },
  { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' },
  { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' },
  { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' },
  { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' },
  { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' },
  { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' },
  { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' },
  { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' },
  { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' },
  { abbr: 'OH', name: 'Ohio' },
  { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' },
  { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' },
  { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' },
  { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' },
  { abbr: 'VA', name: 'Virginia' },
  { abbr: 'WA', name: 'Washington' },
  { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' },
  { abbr: 'WY', name: 'Wyoming' }
];

/**
 * State collection grid component
 */
const StateCollection = ({ visitedStates, totalStates, onStateClick }) => {
  // Calculate progress percentage
  const progressPercentage = visitedStates && totalStates 
    ? Math.round((visitedStates.length / totalStates) * 100) 
    : 0;
  
  return (
    <div className="state-collection">
      <div className="collection-header">
        <h3>States Visited</h3>
        <div className="progress-info">
          <span className="progress-count">{visitedStates?.length || 0}/{totalStates}</span>
          <span className="progress-percentage">{progressPercentage}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="states-grid">
        {CONTINENTAL_STATES.map(state => {
          const isVisited = visitedStates?.includes(state.name);
          
          return (
            <div 
              key={state.abbr} 
              className={`state-badge ${isVisited ? 'visited' : 'unvisited'}`}
              onClick={() => onStateClick && onStateClick(state.name)}
              role="button"
              tabIndex="0"
              aria-pressed={isVisited}
            >
              <div className="state-abbr">{state.abbr}</div>
              <div className="state-name">{state.name}</div>
              {isVisited && <div className="visited-checkmark">✓</div>}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="collection-legend">
        <div className="legend-item">
          <div className="legend-color visited"></div>
          <span>Visited</span>
        </div>
        <div className="legend-item">
          <div className="legend-color unvisited"></div>
          <span>Not yet visited</span>
        </div>
      </div>
    </div>
  );
};

StateCollection.propTypes = {
  visitedStates: PropTypes.arrayOf(PropTypes.string),
  totalStates: PropTypes.number,
  onStateClick: PropTypes.func
};

StateCollection.defaultProps = {
  visitedStates: [],
  totalStates: 48
};

export default StateCollection;
