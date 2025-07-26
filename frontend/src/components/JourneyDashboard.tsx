// Journey Dashboard component with real Tessie API data integration
// Displays drive history, charge sessions, extended stays, and journey analytics

import React, { useEffect, useState } from 'react';
import { useJourneyTessieApi } from '@/hooks/useJourneyTessieApi';
import { formatTemperature } from '@/utils/temperature';

interface JourneyDashboardProps {
  vehicleId: string;
  apiKey: string;
  startDate?: string;
  endDate?: string;
}

const JourneyDashboard: React.FC<JourneyDashboardProps> = ({
  vehicleId,
  apiKey,
  startDate = '2025-06-01',
  endDate = '2025-07-26'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'drives' | 'charges' | 'stays'>('overview');
  
  const {
    driveHistory,
    chargeHistory,
    extendedStays,
    journeyAnalytics,
    isLoading,
    error,
    loadJourneyData,
  } = useJourneyTessieApi(apiKey, vehicleId);

  useEffect(() => {
    if (vehicleId && apiKey) {
      loadJourneyData(startDate, endDate);
    }
  }, [vehicleId, apiKey, startDate, endDate, loadJourneyData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDistance = (miles: number) => {
    return `${miles.toFixed(1)} mi`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading journey data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-400">⚠️</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Journey Data</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'drives', label: 'Drives', icon: '🚗' },
            { id: 'charges', label: 'Charges', icon: '⚡' },
            { id: 'stays', label: 'Extended Stays', icon: '🏨' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && journeyAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Key Stats */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center">
              <div className="text-2xl">🚗</div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Total Drives</p>
                <p className="text-xl font-bold text-gray-900">{journeyAnalytics.totalDrives}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center">
              <div className="text-2xl">⚡</div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Charge Sessions</p>
                <p className="text-xl font-bold text-gray-900">{journeyAnalytics.totalCharges}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center">
              <div className="text-2xl">🗺️</div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">States Visited</p>
                <p className="text-xl font-bold text-gray-900">{journeyAnalytics.statesCrossed.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center">
              <div className="text-2xl">🏨</div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Extended Stays</p>
                <p className="text-xl font-bold text-gray-900">{journeyAnalytics.totalExtendedStays}</p>
              </div>
            </div>
          </div>

          {/* States List */}
          <div className="md:col-span-2 lg:col-span-2 bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">States Crossed</h3>
            <div className="flex flex-wrap gap-2">
              {journeyAnalytics.statesCrossed.map(state => (
                <span
                  key={state}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {state}
                </span>
              ))}
            </div>
          </div>

          {/* Longest Drive */}
          {journeyAnalytics.longestDrive && (
            <div className="md:col-span-2 lg:col-span-2 bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Longest Drive</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">From:</span> {journeyAnalytics.longestDrive.start_location_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">To:</span> {journeyAnalytics.longestDrive.end_location_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Distance:</span> {formatDistance(journeyAnalytics.longestDrive.distance_miles)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Duration:</span> {formatDuration(journeyAnalytics.longestDrive.duration_minutes)}
                </p>
              </div>
            </div>
          )}

          {/* Charging Summary */}
          <div className="md:col-span-2 lg:col-span-4 bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Charging Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Energy Added</p>
                <p className="text-lg font-bold text-gray-900">{journeyAnalytics.totalEnergyAdded} kWh</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Charging Cost</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(journeyAnalytics.totalChargingCost)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Cost per kWh</p>
                <p className="text-lg font-bold text-gray-900">
                  {journeyAnalytics.totalEnergyAdded > 0 
                    ? formatCurrency(journeyAnalytics.totalChargingCost / journeyAnalytics.totalEnergyAdded)
                    : '$0.00'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drives Tab */}
      {activeTab === 'drives' && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">🚗 Drive History</h3>
            <p className="text-sm text-gray-600">{driveHistory.length} drives total</p>
          </div>
          <div className="divide-y divide-gray-200">
            {driveHistory.map(drive => (
              <div key={drive.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(drive.start_date)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDistance(drive.distance_miles)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDuration(drive.duration_minutes)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">From:</span> {drive.start_location_name}</p>
                      {drive.start_city && drive.start_state && (
                        <p className="text-xs text-gray-500 ml-12">{drive.start_city}, {drive.start_state}</p>
                      )}
                      <p><span className="font-medium">To:</span> {drive.end_location_name}</p>
                      {drive.end_city && drive.end_state && (
                        <p className="text-xs text-gray-500 ml-12">{drive.end_city}, {drive.end_state}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Avg Speed: {drive.average_speed.toFixed(1)} mph</p>
                    <p>Energy Used: {drive.energy_used.toFixed(1)} kWh</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charges Tab */}
      {activeTab === 'charges' && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">⚡ Charging History</h3>
            <p className="text-sm text-gray-600">{chargeHistory.length} charging sessions</p>
          </div>
          <div className="divide-y divide-gray-200">
            {chargeHistory.map(charge => (
              <div key={charge.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(charge.start_date)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDuration(charge.duration_minutes)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(charge.cost)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">Location:</span> {charge.location_name}</p>
                      {charge.city && charge.state && (
                        <p className="text-xs text-gray-500 ml-16">{charge.city}, {charge.state}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Energy Added: {charge.energy_added.toFixed(1)} kWh</p>
                    <p>Battery: {charge.start_battery_level}% → {charge.end_battery_level}%</p>
                    <p>Max Rate: {charge.charge_rate_max.toFixed(1)} kW</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extended Stays Tab */}
      {activeTab === 'stays' && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">🏨 Extended Stays</h3>
            <p className="text-sm text-gray-600">{extendedStays.length} extended stays detected</p>
          </div>
          <div className="divide-y divide-gray-200">
            {extendedStays.map(stay => (
              <div key={stay.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(stay.startDate)} - {formatDate(stay.endDate)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        stay.reason === 'multi_day_stay' ? 'bg-purple-100 text-purple-800' :
                        stay.reason === 'extended_visit' ? 'bg-blue-100 text-blue-800' :
                        stay.reason === 'charging' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {stay.reason.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">Location:</span> {stay.location}</p>
                      <p className="text-xs text-gray-500 ml-16">{stay.city}, {stay.state}</p>
                      <p><span className="font-medium">Duration:</span> {stay.durationDays.toFixed(1)} days ({stay.durationHours.toFixed(1)} hours)</p>
                      {stay.chargingSessions && stay.chargingSessions.length > 0 && (
                        <p><span className="font-medium">Charging Sessions:</span> {stay.chargingSessions.length}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyDashboard;
