import React from 'react'
import { createRoot } from 'react-dom/client'

function SimpleDebugApp() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a1a', 
      color: 'white', 
      minHeight: '100vh',
      fontFamily: 'monospace'
    }}>
      <h1>🚗 Debug Mode - React is Working!</h1>
      <p>Timestamp: {new Date().toISOString()}</p>
      <p>Location: {window.location.href}</p>
      <p>User Agent: {navigator.userAgent}</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#333', borderRadius: '5px' }}>
        <h2>Debug Information:</h2>
        <ul>
          <li>React Version: {React.version}</li>
          <li>Environment: {import.meta.env.MODE || 'unknown'}</li>
          <li>DOM Ready: ✅</li>
          <li>Root Element Found: ✅</li>
        </ul>
      </div>
    </div>
  )
}


const rootElement = document.getElementById('root')
if (rootElement) {
  const root = createRoot(rootElement)
  root.render(<SimpleDebugApp />)
} else {
  console.error('Root element not found')
}
