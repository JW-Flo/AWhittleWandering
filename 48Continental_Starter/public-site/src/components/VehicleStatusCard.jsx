import React from 'react';
import { useVehicleData } from '../hooks/useVehicleData';

/**
 * Vehicle Status Card Component
 * Displays real-time Tesla vehicle data and connection status
 */
export default function VehicleStatusCard() {
  const { 
    vehicleData, 
    vehicleLoading, 
    vehicleError, 
    connectionStatus,
    reconnect
  } = useVehicleData({ enableStreaming: true });

  // Generate connection status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'reconnecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Format timestamp to human-readable time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Format battery level with icon
  const batteryIcon = (level) => {
    if (level >= 75) return '🔋';
    if (level >= 50) return '🔋';
    if (level >= 25) return '🪫';
    return '🪫';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Vehicle Status</h2>
        <span className={`px-2 py-1 rounded-full text-white text-xs ${getStatusColor(connectionStatus)}`}>
          {connectionStatus}
        </span>
      </div>
      
      {vehicleLoading && !vehicleData && (
        <div className="text-center py-4">
          <p>Loading vehicle data...</p>
          <div className="animate-pulse mt-2 h-4 bg-gray-200 rounded"></div>
        </div>
      )}

      {vehicleError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p className="font-bold">Error</p>
          <p>{vehicleError}</p>
          <button 
            onClick={reconnect}
            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
          >
            Reconnect
          </button>
        </div>
      )}

      {vehicleData && (
        <div className="space-y-4">
          {/* Vehicle Info */}
          <div className="border-b pb-2">
            <h3 className="font-medium text-gray-700">{vehicleData.display_name || 'Tesla'}</h3>
            <p className="text-sm text-gray-500">VIN: {vehicleData.vin || 'Unknown'}</p>
          </div>
          
          {/* Battery Status */}
          {vehicleData.charge_state && (
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium">Battery</h4>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{batteryIcon(vehicleData.charge_state.battery_level)}</span>
                  <span className="text-xl font-bold">{vehicleData.charge_state.battery_level}%</span>
                </div>
                <p className="text-sm text-gray-600">
                  {vehicleData.charge_state.charging_state === 'Charging' 
                    ? `Charging at ${vehicleData.charge_state.charge_rate} mph` 
                    : vehicleData.charge_state.charging_state}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Range</h4>
                <p className="text-xl font-bold">{Math.round(vehicleData.charge_state.battery_range)} mi</p>
              </div>
            </div>
          )}
          
          {/* Location & Speed */}
          {vehicleData.drive_state && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Location</h4>
                <p className="text-sm">
                  {vehicleData.drive_state.latitude.toFixed(4)}, {vehicleData.drive_state.longitude.toFixed(4)}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Speed</h4>
                <p className="text-xl font-bold">{vehicleData.drive_state.speed || '0'} mph</p>
              </div>
            </div>
          )}
          
          {/* Climate */}
          {vehicleData.climate_state && (
            <div className="border-t pt-2">
              <h4 className="font-medium">Climate</h4>
              <div className="flex justify-between">
                <p>Inside: {vehicleData.climate_state.inside_temp}°F</p>
                <p>Outside: {vehicleData.climate_state.outside_temp}°F</p>
                <p>{vehicleData.climate_state.is_climate_on ? 'Climate On' : 'Climate Off'}</p>
              </div>
            </div>
          )}
          
          {/* Last Updated */}
          <div className="text-right text-xs text-gray-500 pt-2">
            Last updated: {formatTimestamp(vehicleData.drive_state?.timestamp || Date.now())}
          </div>
        </div>
      )}
    </div>
  );
}
