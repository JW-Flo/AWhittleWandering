import { Battery, MapPin, Thermometer, Lock, Unlock, Car, Zap } from 'lucide-react';
import { useRealtimeStatus } from '../hooks/useRealtimeStatus';

interface RealtimeStatusCardProps {
  className?: string;
}

export function RealtimeStatusCard({ className = '' }: RealtimeStatusCardProps) {
  const { status, isLoading, error, isPolling } = useRealtimeStatus({
    pollInterval: 30000, // 30 seconds
    autoStart: true
  });

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-700">
          <Car className="w-5 h-5" />
          <span className="font-medium">Real-time Status Error</span>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading && !status) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-gray-300 rounded"></div>
            <div className="w-32 h-4 bg-gray-300 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-3 bg-gray-300 rounded"></div>
            <div className="w-3/4 h-3 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-gray-500 text-center">
          <Car className="w-8 h-8 mx-auto mb-2" />
          <p>No real-time data available</p>
        </div>
      </div>
    );
  }

  const batteryColor = status.battery_level ? 
    status.battery_level > 50 ? 'text-green-600' :
    status.battery_level > 20 ? 'text-yellow-600' :
    'text-red-600' : 'text-gray-400';

  const lastUpdate = status.lastUpdated ? new Date(status.lastUpdated) : new Date(status.timestamp);
  const timeSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">{status.vehicle_name}</h3>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {isPolling && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
          <span className="text-gray-500">
            {status.cached ? `Cached (${status.cacheAge}s)` : 'Live'}
          </span>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Battery */}
        <div className="flex items-center gap-2">
          <Battery className={`w-4 h-4 ${batteryColor}`} />
          <span className="text-sm font-medium">
            {status.battery_level ? `${status.battery_level}%` : 'N/A'}
          </span>
        </div>

        {/* Charging State */}
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${status.charging_state === 'Charging' ? 'text-green-600' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">{status.charging_state}</span>
        </div>

        {/* Lock Status */}
        <div className="flex items-center gap-2">
          {status.locked ? (
            <Lock className="w-4 h-4 text-green-600" />
          ) : (
            <Unlock className="w-4 h-4 text-red-600" />
          )}
          <span className="text-sm font-medium">
            {status.locked ? 'Locked' : 'Unlocked'}
          </span>
        </div>

        {/* Climate */}
        <div className="flex items-center gap-2">
          <Thermometer className={`w-4 h-4 ${status.climate_on ? 'text-blue-600' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">
            {status.inside_temp ? `${Math.round(status.inside_temp)}°C` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Location and Additional Info */}
      <div className="space-y-2 text-sm text-gray-600">
        {status.location.latitude && status.location.longitude && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>
              {status.location.latitude.toFixed(4)}, {status.location.longitude.toFixed(4)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>State: <span className="font-medium">{status.state}</span></span>
          {status.odometer && (
            <span>Odometer: <span className="font-medium">{Math.round(status.odometer).toLocaleString()} km</span></span>
          )}
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t">
          Last updated: {timeSinceUpdate < 60 ? `${timeSinceUpdate}s ago` : `${Math.floor(timeSinceUpdate / 60)}m ago`}
        </div>
      </div>
    </div>
  );
}

export default RealtimeStatusCard;
