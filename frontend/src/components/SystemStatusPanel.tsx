import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Activity, AlertTriangle } from 'lucide-react';

interface SystemStatusProps {
  tessieApiKey: string | null;
  isDemoMode: boolean;
  vehicles: any[];
  vehicleData: any;
  historicalDrives: any[];
  historicalCharges: any[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onRefreshHistorical: () => void;
  onToggleDemo: () => void;
  journeyStats: any;
}

export const SystemStatusPanel: React.FC<SystemStatusProps> = ({
  tessieApiKey,
  isDemoMode,
  vehicles,
  vehicleData,
  historicalDrives,
  historicalCharges,
  isLoading,
  error,
  onRefresh,
  onRefreshHistorical,
  onToggleDemo,
  journeyStats
}) => {
  const getStatusColor = (condition: boolean) => condition ? 'text-green-400' : 'text-red-400';
  const getStatusIcon = (condition: boolean) => condition ? '🟢' : '🔴';

  return (
    <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700 text-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          System Status Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Connection Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
            <div className="text-xs text-gray-400 uppercase tracking-wide">API Status</div>
            <div className={`font-bold ${getStatusColor(!!tessieApiKey)}`}>
              {getStatusIcon(!!tessieApiKey)} {tessieApiKey ? 'CONNECTED' : 'MISSING'}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Mode</div>
            <div className="font-bold text-yellow-400">
              {isDemoMode ? '🎭 DEMO' : '🚗 LIVE'}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Loading</div>
            <div className={`font-bold ${getStatusColor(!isLoading)}`}>
              {isLoading ? '🟡 YES' : '🟢 NO'}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Errors</div>
            <div className={`font-bold ${getStatusColor(!error)}`}>
              {error ? '🔴 YES' : '🟢 NO'}
            </div>
          </div>
        </div>

        {/* Data Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
            <div className="text-xs text-blue-300 uppercase tracking-wide">Vehicles</div>
            <div className="text-2xl font-bold text-blue-100">{vehicles.length}</div>
          </div>
          
          <div className="bg-green-900/30 p-3 rounded-lg border border-green-500/30">
            <div className="text-xs text-green-300 uppercase tracking-wide">Historical Drives</div>
            <div className="text-2xl font-bold text-green-100">{historicalDrives.length}</div>
          </div>
          
          <div className="bg-purple-900/30 p-3 rounded-lg border border-purple-500/30">
            <div className="text-xs text-purple-300 uppercase tracking-wide">Historical Charges</div>
            <div className="text-2xl font-bold text-purple-100">{historicalCharges.length}</div>
          </div>
          
          <div className="bg-orange-900/30 p-3 rounded-lg border border-orange-500/30">
            <div className="text-xs text-orange-300 uppercase tracking-wide">Journey Miles</div>
            <div className="text-2xl font-bold text-orange-100">
              {journeyStats?.totalJourneyMiles?.toLocaleString() || '0'}
            </div>
          </div>
        </div>

        {/* Vehicle Data Status */}
        {vehicleData && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
            <h4 className="font-bold text-green-400 mb-2">✅ Vehicle Data Available</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>Battery: <span className="text-green-300">{vehicleData.battery_level}%</span></div>
              <div>Range: <span className="text-blue-300">{vehicleData.battery_range} mi</span></div>
              <div>Odometer: <span className="text-yellow-300">{vehicleData.odometer?.toLocaleString()} mi</span></div>
              <div>Location: <span className="text-purple-300">{vehicleData.latitude?.toFixed(4)}, {vehicleData.longitude?.toFixed(4)}</span></div>
            </div>
          </div>
        )}

        {/* Sample Data Display */}
        {historicalDrives.length > 0 && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
            <h4 className="font-bold text-blue-400 mb-2">📊 Sample Drive Data</h4>
            <div className="text-sm text-gray-300 font-mono">
              <div>ID: {historicalDrives[0].id}</div>
              <div>Distance: {historicalDrives[0].distance_miles} miles</div>
              <div>From: {historicalDrives[0].start_address}</div>
              <div>To: {historicalDrives[0].end_address}</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 p-4 rounded-lg border border-red-500 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-300 mb-1">System Error</h4>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={onRefresh}
            size="sm"
            variant="outline"
            className="bg-blue-900/30 border-blue-500 text-blue-200 hover:bg-blue-800/40"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Vehicle
          </Button>
          
          <Button 
            onClick={onRefreshHistorical}
            size="sm"
            variant="outline"
            className="bg-purple-900/30 border-purple-500 text-purple-200 hover:bg-purple-800/40"
            disabled={isLoading}
          >
            <Database className="w-4 h-4 mr-2" />
            Refresh Historical
          </Button>
          
          <Button 
            onClick={onToggleDemo}
            size="sm"
            variant="outline"
            className="bg-yellow-900/30 border-yellow-500 text-yellow-200 hover:bg-yellow-800/40"
          >
            {isDemoMode ? '🚗 Use Live Data' : '🎭 Use Demo Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
