import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          A Whittle Wandering
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl">
          Epic cross-country Tesla road trip tracker - Currently undergoing maintenance
        </p>
        <div className="space-y-4">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">🚗 Journey Status</h2>
            <p className="text-gray-400">System restoration in progress...</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">🔧 Current Status</h2>
            <div className="text-green-400">✅ Website is now loading correctly!</div>
            <div className="text-blue-400">🔄 Full functionality being restored</div>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Deployment Test: {new Date().toISOString()}
        </p>
      </div>
    </div>
  );
}

export default App;
