import React from 'react';

export default function AboutPage() {
  return (
    <div className="about-page">
      <h1>About Our Journey</h1>
      
      <section className="about-section">
        <h2>The 48-State Challenge</h2>
        <p>
          We're embarking on an epic road trip to visit all 48 continental United States 
          in a single journey. Using our Tesla, we're documenting the entire adventure 
          in real-time, sharing the highs, lows, and everything in between.
        </p>
      </section>
      
      <section className="about-section">
        <h2>Why Electric?</h2>
        <p>
          We chose to make this journey in an electric vehicle to showcase how far 
          EV technology has come. The Tesla's range and the extensive Supercharger network 
          make it possible to cross the country with minimal charging anxiety, while 
          reducing our carbon footprint along the way.
        </p>
      </section>
      
      <section className="about-section">
        <h2>About the Team</h2>
        <p>
          We're a family of adventurers who love exploration and technology. This journey 
          combines our passion for travel with our interest in sustainable transportation 
          and software development.
        </p>
      </section>
      
      <section className="about-section">
        <h2>About This Site</h2>
        <p>
          This website features real-time tracking of our journey using the Tesla API via Tessie,
          Cloudflare Workers for secure API access, and Mapbox for visualization. The entire
          system is built to be responsive, secure, and reliable, even when we're in areas
          with limited connectivity.
        </p>
      </section>
    </div>
  );
}
