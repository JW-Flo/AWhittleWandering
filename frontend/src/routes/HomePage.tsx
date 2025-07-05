import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>A Whittle Wandering</h1>
          <h2>60 days, 48 states, One Tesla, One epic journey</h2>
          <p>Follow along as we travel through every continental US state in an electric vehicle.</p>
          <div className="cta-buttons">
            <Link to="/map" className="cta-button primary">Track Our Journey</Link>
            <Link to="/daily-log" className="cta-button secondary">View Daily Logs</Link>
          </div>
        </div>
      </section>
      
      <section className="journey-stats">
        <div className="stat-card">
          <h3>Days on the Road</h3>
          <div className="stat-value">24</div>
          <p>of 60 planned</p>
        </div>
        <div className="stat-card">
          <h3>States Visited</h3>
          <div className="stat-value">18</div>
          <p>of 48 continental states</p>
        </div>
        <div className="stat-card">
          <h3>Miles Driven</h3>
          <div className="stat-value">7,822</div>
          <p>and counting</p>
        </div>
        <div className="stat-card">
          <h3>Supercharger Stops</h3>
          <div className="stat-value">42</div>
          <p>across the country</p>
        </div>
      </section>
      
      <section className="latest-updates">
        <h2>Latest Updates</h2>
        <div className="updates-grid">
          <div className="update-card">
            <div className="update-date">June 12, 2025</div>
            <h3>Mountain Views in Colorado</h3>
            <p>We've reached the Rocky Mountains! The drive through Colorado has been breathtaking with stunning mountain views at every turn.</p>
            <Link to="/daily-log/24" className="read-more">Read More</Link>
          </div>
          <div className="update-card">
            <div className="update-date">June 10, 2025</div>
            <h3>Kansas Prairies and Windmills</h3>
            <p>Crossing the plains of Kansas offered a different kind of beauty with endless fields and modern windmill farms on the horizon.</p>
            <Link to="/daily-log/22" className="read-more">Read More</Link>
          </div>
          <div className="update-card">
            <div className="update-date">June 8, 2025</div>
            <h3>Missouri's Gateway Arch</h3>
            <p>We spent the morning exploring St. Louis and visiting the iconic Gateway Arch before heading west toward Kansas City.</p>
            <Link to="/daily-log/20" className="read-more">Read More</Link>
          </div>
        </div>
      </section>
      
      <section className="about-trip">
        <div className="about-content">
          <h2>About Our Journey</h2>
          <p>A Whittle Wandering is a 60-day adventure across all 48 continental United States in a Tesla. Our goal is to showcase the possibilities of electric vehicle travel while experiencing the diverse landscapes, cultures, and communities that make America unique.</p>
          <p>We're documenting everything from charging infrastructure to local attractions, creating a comprehensive guide for future electric road-trippers.</p>
          <Link to="/about" className="learn-more">Learn More About Our Trip</Link>
        </div>
        <div className="route-preview">
          {/* Map preview image would go here */}
          <div className="route-map-placeholder">
            <div className="placeholder-text">Interactive Route Map</div>
          </div>
        </div>
      </section>
    </div>
  );
}
