/**
 * A Whittle Wandering Web Application Entry Point
 * 
 * This file initializes the A Whittle Wandering road trip tracking website.
 */

/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from './router';

// Import global styles
import '../styles.css';
// Import component-specific styles
import './styles/charging-stations.css';

// Create a React root and render the Router component
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);

console.log('A Whittle Wandering React application initialized');

// Handle errors globally
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
