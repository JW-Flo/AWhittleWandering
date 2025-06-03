/**
 * 48 Continental USA Web Application Entry Point
 * 
 * This is the main entry point for the React application that powers
 * the 48 Continental USA road trip tracking website.
 */

/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import global styles
import '../styles.css';
// Import component-specific styles
import './styles/charging-stations.css';

// Create a React root and render the App component
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('48 Continental USA React application initialized');

// Handle errors globally
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
