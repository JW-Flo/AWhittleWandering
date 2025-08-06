import React, { useState, useEffect } from 'react';
import { TeslaDataProvider } from '@/contexts/TeslaDataContext';
import { api } from '@/lib/api-config';

interface TeslaData {
  overview: {
    tripName: string;
    vehicle: string;
    startDate: string;
    daysElapsed: number;
    totalMiles: number;
    currentOdometer: number;
    statesVisited: number;
    totalStates: number;
  };
  currentStatus: {
    battery: {
      level: number;
      range: number;
      charging: string;
    };
    location: {
      coordinates: {
        lat: number;
        lng: number;
      };
      state: string;
      lastUpdate: string;
      city: string;
    };
    vehicle: {
      odometer: number;
      speed: number;
      temperature: {
        inside: number;
        outside: number;
      };
    };
  };
  timeline: {
    drives: Array<{
      id: number;
      date: string;
      startTime: string;
      endTime: string;
      distance: number;
      startLocation: string;
      endLocation: string;
      startCoordinates: { lat: number; lng: number };
      endCoordinates: { lat: number; lng: number };
    }>;
    charges: Array<{
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      location: string;
      energyAdded: number;
      cost: number;
    }>;
  };
  tessieStatus: {
    connected: boolean;
    lastUpdate: string;
    dataFreshness: string;
  };
}

const IndexContent = () => {
  const [realTeslaData, setRealTeslaData] = useState<TeslaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load real Tesla data on component mount
  useEffect(() => {
    const loadTeslaData = async () => {
      try {
        const data = await api.getUnifiedData();
        setRealTeslaData(data as TeslaData);
        setError(null);
      } catch (err) {
        console.error('Failed to load Tesla data:', err);
        setError('Failed to load Tesla data');
      }
    };

    loadTeslaData();
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ padding: '20px', backgroundColor: realTeslaData ? 'green' : (error ? 'red' : 'blue'), color: 'white' }}>
      <h1>Tesla Road Trip Tracker - Minimal Test</h1>
      
      {error && (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px', margin: '10px 0' }}>
          <p>Error: {error}</p>
        </div>
      )}

      {realTeslaData && (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px', margin: '10px 0' }}>
          <h2>Trip: {realTeslaData.overview?.tripName}</h2>
          <p>Vehicle: {realTeslaData.overview?.vehicle}</p>
          <p>Battery: {realTeslaData.currentStatus?.battery?.level}%</p>
          <p>State: {realTeslaData.currentStatus?.location?.state}</p>
          <p>Connected: {realTeslaData.tessieStatus?.connected ? 'Yes' : 'No'}</p>
        </div>
      )}

      {!realTeslaData && !error && (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px', margin: '10px 0' }}>
          <p>Loading Tesla data...</p>
        </div>
      )}
    </div>
  );
};

const Index = () => {
  return (
    <TeslaDataProvider>
      <IndexContent />
    </TeslaDataProvider>
  );
};

export default Index;
