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

  // Helper function to extract city and state from location string
  const parseLocation = (locationString: string) => {
    if (!locationString) return { city: 'Unknown', state: 'Unknown' };
    
    // Handle different location formats:
    // "Bar Harbor, Cadillac Mountain (sunrise hike), Maine"
    // "Stratford stay with Deanna, Connecticut"
    // "Start: Corpus Christi, Texas"
    // "Watch Hill Point (coastal visit), Rhode Island"
    
    // Remove prefix if exists (Start:, End:, etc.)
    let cleanLocation = locationString.replace(/^(Start:|End:)\s*/, '');
    
    // Split by comma and get the last part as state
    const parts = cleanLocation.split(', ');
    if (parts.length >= 2) {
      // Last part should contain the state
      const statePart = parts[parts.length - 1].trim();
      
      // Handle multi-word states like "Rhode Island", "New York", etc.
      const knownStates = new Set([
        'Rhode Island', 'New York', 'New Hampshire', 'New Jersey', 'New Mexico',
        'North Carolina', 'North Dakota', 'South Carolina', 'South Dakota', 
        'West Virginia', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
        'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
        'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
        'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
        'Missouri', 'Montana', 'Nebraska', 'Nevada', 'Ohio', 'Oklahoma', 'Oregon',
        'Pennsylvania', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
        'Washington', 'Wisconsin', 'Wyoming'
      ]);
      
      // Check if the full last part is a known state
      let state = statePart;
      if (!knownStates.has(statePart)) {
        // Try first word if full part isn't a known state
        state = statePart.split(' ')[0];
      }
      
      // Second to last part is usually city/region
      const city = parts[parts.length - 2].trim();
      
      return { city, state };
    }
    
    return { city: 'Unknown', state: 'Unknown' };
  };

  // Calculate actual journey stats - use API overview data when available
  const calculateJourneyStats = () => {
    // Use API overview data first (most reliable)
    const daysElapsed = data?.overview?.daysElapsed || 0;
    
    // Calculate states from drives if timeline data exists
    const states = new Set<string>();
    if (data?.timeline?.drives) {
      data.timeline.drives.forEach(drive => {
        const startLoc = parseLocation(drive.startLocation);
        const endLoc = parseLocation(drive.endLocation);
        if (startLoc.state !== 'Unknown') states.add(startLoc.state);
        if (endLoc.state !== 'Unknown') states.add(endLoc.state);
      });
    }

    // Calculate date range from drives if available
    let earliestDrive = null;
    let latestDrive = null;
    if (data?.timeline?.drives && data.timeline.drives.length > 0) {
      const sortedDrives = [...data.timeline.drives].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      earliestDrive = new Date(sortedDrives[0].date);
      latestDrive = new Date(sortedDrives[sortedDrives.length - 1].date);
    } else if (data?.overview?.startDate) {
      // Fallback to overview start date
      earliestDrive = new Date(data.overview.startDate);
      latestDrive = new Date(); // Current date
    }

    return {
      startDate: earliestDrive,
      daysElapsed: daysElapsed,
      statesVisited: Array.from(states),
      earliestDrive: earliestDrive,
      latestDrive: latestDrive
    };
  };

  // Function to get current location from API data
  const getCurrentLocation = () => {
    // Try currentStatus location first
    if (data?.currentStatus?.location) {
      // If API has location text, use it
      if (data.currentStatus.location.city && data.currentStatus.location.state) {
        return {
          city: data.currentStatus.location.city,
          state: data.currentStatus.location.state
        };
      }
    }

    // Fallback to latest drive endpoint if available
    if (data?.timeline?.drives && data.timeline.drives.length > 0) {
      // Ensure drives are sorted by date descending (newest first)
      const sortedDrives = [...data.timeline.drives].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestDrive = sortedDrives[0];
      return parseLocation(latestDrive.endLocation);
    // No reliable fallback for coordinates; return unknown if location is not found
    return { city: 'Unknown', state: 'Unknown' };
  };
    return { city: 'Unknown', state: 'Unknown' };
  };
  // Calculate total miles from actual drives (more accurate than API overview)
  const calculateTotalMiles = () => {
    // Use API overview total miles as primary source
    if (data?.overview?.totalMiles) {
      return data.overview.totalMiles;
    }
    
    // Fallback to calculating from drives
    if (!data?.timeline?.drives) return 0;
    
    const driveMiles = data.timeline.drives.reduce((total, drive) => total + (drive.distance || 0), 0);
    return driveMiles;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

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

  const currentLocation = getCurrentLocation();
  const journeyStats = calculateJourneyStats();
  const totalMiles = calculateTotalMiles();
  const statesVisited = journeyStats.statesVisited;
  const actualStatesCount = statesVisited.length;

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
          <div className="text-sm text-gray-400">
            Last Updated: {formatTimestamp(data.currentStatus?.location?.lastUpdate || '')}
          </div>
          {journeyStats.startDate && (
            <div className="text-sm text-gray-500">
              Journey: {journeyStats.earliestDrive?.toLocaleDateString()} → {journeyStats.latestDrive?.toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overview Stats */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">🗺️ Journey Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>States Visited:</span>
                <span className="text-blue-400 font-bold">{actualStatesCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Miles:</span>
                <span className="text-green-400 font-bold">{totalMiles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Days Elapsed:</span>
                <span className="text-purple-400 font-bold">{journeyStats.daysElapsed}</span>
              </div>
              <div className="flex justify-between">
                <span>Odometer:</span>
                <span className="text-yellow-400 font-bold">{(data.currentStatus?.vehicle?.odometer || 0).toLocaleString()} mi</span>
              </div>
            </div>
            {data.timeline?.drives?.length && data.timeline.drives.length < 10 && (
              <div className="mt-4 p-3 bg-yellow-900/30 rounded text-sm text-yellow-300">
                ⚠️ Limited data: Only {data.timeline.drives.length} drives found. Missing historical journey data?
              </div>
            )}
          </div>

          {/* Current Status */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">🔋 Current Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Battery:</span>
                <span className="text-green-400 font-bold">{data.currentStatus?.battery?.level || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Range:</span>
                <span className="text-blue-400 font-bold">{data.currentStatus?.battery?.range || 0} mi</span>
              </div>
              <div className="flex justify-between">
                <span>Charging:</span>
                <span className={`font-bold ${data.currentStatus?.battery?.charging === 'Charging' ? 'text-green-400' : 'text-gray-400'}`}>
                  {data.currentStatus?.battery?.charging || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Speed:</span>
                <span className="text-yellow-400 font-bold">{data.currentStatus?.vehicle?.speed || 0} mph</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">📍 Location</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Current City:</span>
                <span className="text-blue-400 font-bold">{currentLocation.city}</span>
              </div>
              <div className="flex justify-between">
                <span>Current State:</span>
                <span className="text-green-400 font-bold">{currentLocation.state}</span>
              </div>
              <div className="flex justify-between">
                <span>Temperature:</span>
                <span className="text-orange-400 font-bold">{Math.round((data.currentStatus?.vehicle?.temperature?.outside || 0) * 9/5 + 32)}°F</span>
              </div>
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="text-gray-400 text-sm">
                  {data.currentStatus?.location?.coordinates?.lat?.toFixed(3)}, {data.currentStatus?.location?.coordinates?.lng?.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* States Visited */}
        {statesVisited.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">🏛️ States Visited ({statesVisited.length})</h2>
            <div className="flex flex-wrap gap-2">
              {statesVisited.map((state, index) => (
                <span key={index} className="bg-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                  {state}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Drives */}
        {data.timeline?.drives && data.timeline.drives.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">🚗 Recent Drives</h2>
            <div className="space-y-4">
              {data.timeline.drives.slice(0, 3).map((drive, index) => {
                const startLoc = parseLocation(drive.startLocation);
                const endLoc = parseLocation(drive.endLocation);
                return (
                  <div key={drive.id || index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-400">
                          {startLoc.city}, {startLoc.state} → {endLoc.city}, {endLoc.state}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(drive.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">{drive.distance} mi</div>
                        <div className="text-xs text-gray-400">
                          {Math.round((drive.endTime - drive.startTime) / 60)} min
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Raw Data Debug (for development) */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">🔧 Debug Info</h2>
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-400 hover:text-white">Show Raw Data</summary>
            <pre className="mt-4 text-xs text-gray-300 overflow-auto bg-gray-900 p-4 rounded max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default MinimalTeslaApp;
