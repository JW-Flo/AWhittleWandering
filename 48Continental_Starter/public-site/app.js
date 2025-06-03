/**
 * Main Application Entry Point for 48 Continental USA
 * 
 * This is the primary entry point for the application.
 * It imports and initializes all the necessary modules.
 */

/* eslint-env browser */
// Use React entry point instead of the legacy bootstrap
import './src/index.jsx';

// Set up global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Show error UI if we have a critical failure
  if (document.getElementById('loading-screen')) {
    const loadingContent = document.getElementById('loading-screen').querySelector('.loading-content');
    if (loadingContent) {
      loadingContent.innerHTML = `
        <h1>Something went wrong</h1>
        <p>We encountered an error while loading the application.</p>
        <p class="error-details">${event.error?.message || 'Unknown error'}</p>
        <button onclick="location.reload()">Try Again</button>
      `;
    }
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Note: We don't show a UI error for this as it might not be critical
  // and is often caused by network issues that auto-resolve
});

// Initialize service worker for offline capabilities
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

// Auto-reload the page if it has been open for more than 24 hours
// This helps ensure the latest version is always running
(function setupAutoReload() {
  const RELOAD_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  const lastReloadTime = localStorage.getItem('lastReloadTime');
  const now = Date.now();
  
  if (lastReloadTime && (now - parseInt(lastReloadTime, 10)) > RELOAD_INTERVAL) {
    console.log('Application has been open for more than 24 hours, reloading for freshness...');
    localStorage.setItem('lastReloadTime', now.toString());
    window.location.reload();
  } else if (!lastReloadTime) {
    localStorage.setItem('lastReloadTime', now.toString());
  }
})();
