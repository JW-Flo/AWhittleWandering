import { useState, useCallback } from 'react';

const STORAGE_KEY = '48continental-statistics';

const defaultStats = {
  visitedStates: [],
  dailyDistance: [],
  totalDistance: 0,
  energyConsumption: [],
  averageConsumption: 0,
  averageSpeed: 0,
  drivingTimes: [],
};

export const useStatisticsState = () => {
  const [stats, setStats] = useState(defaultStats);

  // Load stats from localStorage
  const loadStats = useCallback(() => {
    try {
      const savedStats = localStorage.getItem(STORAGE_KEY);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, []);

  // Save stats to localStorage
  const saveStats = useCallback((newStats) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
    } catch (error) {
      console.error('Error saving statistics:', error);
    }
  }, []);

  // Update stats with new data
  const updateStats = useCallback((updates) => {
    setStats(currentStats => {
      const newStats = {
        ...currentStats,
        ...updates,
        // Update timestamp
        lastUpdated: new Date().toISOString(),
      };
      saveStats(newStats);
      return newStats;
    });
  }, [saveStats]);

  // Add a visited state
  const addVisitedState = useCallback((state) => {
    updateStats(currentStats => ({
      visitedStates: [
        ...currentStats.visitedStates,
        {
          name: state,
          visitDate: new Date().toISOString(),
        },
      ],
    }));
  }, [updateStats]);

  // Add daily distance
  const addDailyDistance = useCallback((distance) => {
    updateStats(currentStats => ({
      dailyDistance: [
        ...currentStats.dailyDistance,
        {
          date: new Date().toISOString().split('T')[0],
          distance,
        },
      ],
      totalDistance: currentStats.totalDistance + distance,
    }));
  }, [updateStats]);

  // Add energy consumption
  const addEnergyConsumption = useCallback((consumption) => {
    updateStats(currentStats => {
      const newConsumption = [
        ...currentStats.energyConsumption,
        {
          date: new Date().toISOString().split('T')[0],
          consumption,
        },
      ];
      const averageConsumption = 
        newConsumption.reduce((acc, curr) => acc + curr.consumption, 0) / 
        newConsumption.length;

      return {
        energyConsumption: newConsumption,
        averageConsumption,
      };
    });
  }, [updateStats]);

  // Add driving time
  const addDrivingTime = useCallback((duration, hour) => {
    updateStats(currentStats => ({
      drivingTimes: [
        ...currentStats.drivingTimes,
        {
          duration,
          hour,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  }, [updateStats]);

  // Clear all stats
  const clearStats = useCallback(() => {
    setStats(defaultStats);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    stats,
    loadStats,
    updateStats,
    addVisitedState,
    addDailyDistance,
    addEnergyConsumption,
    addDrivingTime,
    clearStats,
  };
};
