import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <h1>404 - Page Not Found</h1>
      <p>Oops! The page you're looking for doesn't exist or has been moved.</p>
      
      <div className="not-found-suggestions">
        <h2>You might want to try:</h2>
        <ul>
          <li>
            <Link to="/">Return to the Homepage</Link>
          </li>
          <li>
            <Link to="/map">View the Live Trip Map</Link>
          </li>
          <li>
            <Link to="/log">Check the Trip Log</Link>
          </li>
        </ul>
      </div>
      
      <div className="not-found-image">
        <img 
          src="/images/lost-tesla.svg" 
          alt="Lost Tesla" 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/fallback-image.png';
          }}
        />
      </div>
    </div>
  );
}
