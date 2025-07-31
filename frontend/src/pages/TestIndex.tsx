import React from 'react';

const TestIndex = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔧 Debug Mode - Site is Loading!</h1>
      <p>Current time: {new Date().toISOString()}</p>
      <p>React is working correctly.</p>
      <p>If you see this, the deployment pipeline is working.</p>
    </div>
  );
};

export default TestIndex;
