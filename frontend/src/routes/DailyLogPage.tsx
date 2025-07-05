import React from 'react';

export default function DailyLogPage() {
  return (
    <div className="daily-log-page">
      <h1>Trip Log</h1>
      <p>Follow our daily adventures as we travel across the United States.</p>
      
      <div className="log-entries">
        {/* Placeholder for log entries - will be populated from API */}
        <div className="log-entry">
          <h2>Day 1: Beginning the Journey</h2>
          <div className="log-date">June 6, 2025</div>
          <p>
            Today marks the beginning of our epic 48-state journey. We left our home base
            early this morning with a fully charged Tesla and plenty of excitement.
            The first leg of our trip takes us through beautiful countryside and we've
            already seen some amazing sights.
          </p>
        </div>
        
        <div className="log-entry">
          <h2>Day 2: First State Border Crossed</h2>
          <div className="log-date">June 7, 2025</div>
          <p>
            We crossed our first state border today! The charging network has been 
            reliable so far, and we've met some interesting fellow travelers at the
            superchargers. Weather has been perfect for driving.
          </p>
        </div>
      </div>
    </div>
  );
}
