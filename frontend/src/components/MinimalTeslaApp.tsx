import React, { useState, useEffect } from 'react';

const MinimalTeslaApp: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching Tesla data...');
        const response = await fetch('https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/unified-data');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Tesla data received:', result);
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto"></div>
          <h2 className="text-2xl font-semibold">Loading Tesla Data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-red-400">Error</h2>
          <p className="text-gray-400">{error}</p>
          <button 
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-yellow-400">No Data</h2>
          <p className="text-gray-400">No Tesla data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            A Whittle Wandering
          </h1>
          <p className="text-xl text-gray-300">
            Tesla Road Trip Tracker - Live Data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overview Stats */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Journey Overview</h2>
            <div className="space-y-2">
              <div>States Visited: <span className="text-blue-400">{data.overview?.statesVisited || 0}</span></div>
              <div>Total Miles: <span className="text-green-400">{data.overview?.totalMiles || 0}</span></div>
              <div>Days Elapsed: <span className="text-purple-400">{data.overview?.daysElapsed || 0}</span></div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Current Status</h2>
            <div className="space-y-2">
              <div>Battery: <span className="text-green-400">{data.currentStatus?.battery?.level || 0}%</span></div>
              <div>Range: <span className="text-blue-400">{data.currentStatus?.battery?.range || 0} mi</span></div>
              <div>Speed: <span className="text-yellow-400">{data.currentStatus?.vehicle?.speed || 0} mph</span></div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Location</h2>
            <div className="space-y-2">
              <div>City: <span className="text-blue-400">{data.currentStatus?.location?.city || 'Unknown'}</span></div>
              <div>State: <span className="text-green-400">{data.currentStatus?.location?.state || 'Unknown'}</span></div>
              <div>Updated: <span className="text-gray-400">{data.currentStatus?.location?.lastUpdate ? new Date(data.currentStatus.location.lastUpdate).toLocaleString() : 'Unknown'}</span></div>
            </div>
          </div>
        </div>

        {/* Raw Data Debug (for development) */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-400 hover:text-white">Show Raw Data</summary>
            <pre className="mt-4 text-xs text-gray-300 overflow-auto bg-gray-900 p-4 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default MinimalTeslaApp;
