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
import '../style.css';

// Load the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Get the root element where React will be mounted
  const root = document.getElementById('immersive-container');
  
  if (root) {
    // Create a React root and render the App component
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('48 Continental USA React application initialized');
  } else {
    console.error('Root element not found. The application could not be mounted.');
  }
});

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}

// Handle errors globally
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
