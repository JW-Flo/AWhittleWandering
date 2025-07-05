import React, { createContext, useContext, useState } from 'react';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(75);
  const [range, setRange] = useState(267);
  const [nextStop, setNextStop] = useState({
    name: 'Kettleman City Supercharger',
    distance: 120,
    eta: '2h 30m'
  });
  const [settings, setSettings] = useState({
    lowBatteryThreshold: 15,
    highTempThreshold: 90,
    dogModeEnabled: true,
    autoNavigationEnabled: true
  });

  const value = {
    location,
    setLocation,
    batteryLevel,
    setBatteryLevel,
    range,
    setRange,
    nextStop,
    setNextStop,
    settings,
    setSettings
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
