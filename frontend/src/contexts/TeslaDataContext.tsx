import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api-config';

interface DriveData {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  distance: number;
  startLocation: string;
  endLocation: string;
  startCoordinates: { lat: number; lng: number };
  endCoordinates: { lat: number; lng: number };
}

interface ChargeData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  energyAdded: number;
  cost: number;
}

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
      coordinates: { lat: number; lng: number };
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
    drives: DriveData[];
    charges: ChargeData[];
  };
  tessieStatus: {
    connected: boolean;
    lastUpdate: string;
    dataFreshness: string;
  };
}

export interface TeslaDataContextType {
  data: TeslaData | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  refreshData: () => Promise<void>;
  lastUpdated: string | null;
}

const TeslaDataContext = createContext<TeslaDataContextType | undefined>(undefined);

interface TeslaDataProviderProps {
  children: ReactNode;
}

export const TeslaDataProvider: React.FC<TeslaDataProviderProps> = ({ children }) => {
  const [data, setData] = useState<TeslaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const unifiedData = await api.getUnifiedData() as TeslaData;
      setData(unifiedData);
      setIsConnected(true);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Failed to fetch Tesla data:', err);
      
      let errorMessage = 'Failed to connect to Tesla data';
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to reach backend API. Please check your connection.';
        } else if (err.message.includes('cors')) {
          errorMessage = 'CORS error: Cross-origin request blocked. Please refresh the page.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-load data when provider mounts
    refreshData();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    
    return () => clearInterval(interval);
  }, [refreshData]);

  const value: TeslaDataContextType = {
    data,
    isLoading,
    error,
    isConnected,
    refreshData,
    lastUpdated
  };

  return (
    <TeslaDataContext.Provider value={value}>
      {children}
    </TeslaDataContext.Provider>
  );
};

export default TeslaDataContext;
