import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

try {
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
} catch (error) {
  console.error('Failed to render app:', error);
  document.getElementById("root")!.innerHTML = `
    <div style="min-height: 100vh; background: #1f2937; color: white; display: flex; align-items: center; justify-content: center;">
      <div style="text-align: center;">
        <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #ef4444;">Application Error</h1>
        <p style="color: #9ca3af;">Failed to load the application. Please refresh the page.</p>
      </div>
    </div>
  `;
}
