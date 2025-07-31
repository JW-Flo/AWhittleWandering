import React, { useState, useEffect } from 'react';
import { useRobustData } from '../hooks/useRobustData';
import AdminLogin from './AdminLogin';
import ApiConfig from './ApiConfig';
import DataDebugger from './DataDebugger';
import { SystemStatusPanel } from './SystemStatusPanel';
import { SystemHealthMonitor } from './SystemHealthMonitor';
import TessieApiDebugger from './TessieApiDebugger';
import MediaManager from './MediaManager';
import { isAdminDomain } from '../utils/adminAccess';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { safeTimeString } from '@/utils/dateHelpers';

const AdminPortal: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { 
    drives, 
    charges, 
    currentLocation, 
    journeyInsights, 
    loading, 
    error, 
    isLive, 
    refresh 
  } = useRobustData();

  useEffect(() => {
    // Check if we're on admin domain
    if (!isAdminDomain()) {
      window.location.href = 'https://awhittlewandering.com';
      return;
    }
  }, []);

  if (!isAdminDomain()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Redirecting to Public Site...</h1>
          <p>Admin portal is only accessible from admin domain.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onAuthChange={(authenticated) => setIsAuthenticated(authenticated)} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'api-config', label: 'API Config', icon: '⚙️' },
    { id: 'data-debug', label: 'Data Debug', icon: '🔍' },
    { id: 'system-status', label: 'System Status', icon: '🖥️' },
    { id: 'tessie-debug', label: 'Tessie Debug', icon: '🚗' },
    { id: 'media', label: 'Media Manager', icon: '📸' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Admin Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-400">
                🔧 A Whittle Wandering - Admin Portal
              </h1>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <Badge variant={isLive ? 'default' : 'destructive'}>
                  {isLive ? 'Live Data' : 'Offline'}
                </Badge>
                {currentLocation && (
                  <span className="text-xs text-gray-400">
                    Last: {safeTimeString(currentLocation.timestamp)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {error && (
                <Button
                  onClick={refresh}
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-400 hover:bg-red-900"
                >
                  Clear Errors
                </Button>
              )}
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                disabled={loading}
                className="text-blue-400 border-blue-400 hover:bg-blue-900"
              >
                {loading ? '🔄' : '🔄'} Refresh
              </Button>
              <Button
                onClick={() => setIsAuthenticated(false)}
                variant="destructive"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900 border-b border-red-700 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-red-400 font-medium">⚠️ Error:</span>
              <span className="text-red-300">{error}</span>
            </div>
            <button
              onClick={refresh}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Admin Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-400">Vehicle Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentLocation ? (
                    <div className="space-y-1">
                      <div className="font-medium text-white">Tesla Model S</div>
                      <div className="text-xs text-gray-400">
                        🔋 {currentLocation.battery_level}% | {currentLocation.charging_state}
                      </div>
                      <div className="text-xs text-gray-400">
                        📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">No vehicle data</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-400">Data Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Drives:</span>
                    <span className="text-white font-medium">{drives?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Charges:</span>
                    <span className="text-white font-medium">{charges?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Miles:</span>
                    <span className="text-white font-medium">
                      {journeyInsights?.totalMiles?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">States:</span>
                    <span className="text-white font-medium">
                      {journeyInsights?.statesVisited?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-purple-400">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Data Source:</span>
                    <Badge variant={isLive ? 'default' : 'destructive'} className="text-xs">
                      {isLive ? 'Live API' : 'Static File'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Loading:</span>
                    <span className="text-white font-medium">{loading ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Error Count:</span>
                    <span className={`font-medium ${error ? 'text-red-400' : 'text-green-400'}`}>
                      {error ? '1' : '0'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-400">Real-time Tracking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {currentLocation ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Status:</span>
                        <Badge variant="default" className="text-xs bg-green-600">
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Speed:</span>
                        <span className="text-white font-medium">
                          {currentLocation.speed || 0} mph
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Battery:</span>
                        <span className="text-white font-medium">
                          {currentLocation.battery_level}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Updated: {safeTimeString(currentLocation.timestamp)}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">No real-time data</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Journey Insights */}
            {journeyInsights && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-400">Journey Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {journeyInsights.totalMiles?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-400">Total Miles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {journeyInsights.daysElapsed || 0}
                      </div>
                      <div className="text-sm text-gray-400">Days Elapsed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {journeyInsights.statesVisited?.length || 0}
                      </div>
                      <div className="text-sm text-gray-400">States Visited</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {journeyInsights.currentProgress?.toFixed(1) || 0}%
                      </div>
                      <div className="text-sm text-gray-400">Progress</div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">States Visited:</h4>
                    <div className="flex flex-wrap gap-1">
                      {journeyInsights.statesVisited?.map((state) => (
                        <Badge key={state} variant="secondary" className="text-xs">
                          {state}
                        </Badge>
                      )) || <span className="text-gray-500">No states recorded</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-green-400">Recent Drives</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {drives?.slice(0, 5).map((drive) => (
                      <div key={drive.id} className="border-b border-gray-700 pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">
                              {drive.start_location?.address?.split(',')[0] || 'Unknown'} → {drive.end_location?.address?.split(',')[0] || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(drive.start_date).toLocaleDateString()} • {drive.distance_miles?.toFixed(0) || 0} miles
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Math.round((drive.duration_minutes || 0) / 60)}h {(drive.duration_minutes || 0) % 60}m
                          </Badge>
                        </div>
                      </div>
                    )) || <div className="text-gray-500">No recent drives</div>}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-400">Recent Charges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {charges?.slice(0, 5).map((charge) => (
                      <div key={charge.id} className="border-b border-gray-700 pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">
                              {charge.location?.address?.split(',')[0] || 'Unknown Location'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(charge.start_date).toLocaleDateString()} • {charge.energy_added?.toFixed(1) || 0} kWh
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {charge.start_battery_level || 0}% → {charge.end_battery_level || 0}%
                          </Badge>
                        </div>
                      </div>
                    )) || <div className="text-gray-500">No recent charges</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'api-config' && (
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-blue-400">API Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <ApiConfig 
                  onApiKeyChange={(key) => console.log('API Key updated:', key)}
                  onVehicleIdChange={(id) => console.log('Vehicle ID updated:', id)}
                  currentApiKey={''}
                  currentVehicleId={'midnightshadow'}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'data-debug' && (
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-green-400">Data Debugger</CardTitle>
              </CardHeader>
              <CardContent>
                <DataDebugger />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'system-status' && (
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-purple-400">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="text-sm text-gray-400">System Status</div>
                      <div className="text-lg font-bold text-green-400">
                        {loading ? 'Connecting...' : error ? 'Error' : 'Connected'}
                      </div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="text-sm text-gray-400">Data Freshness</div>
                      <div className="text-lg font-bold text-blue-400">
                        {currentLocation ? 'Live' : 'Static'}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">Quick Status</div>
                    <div className="text-sm">
                      <div>Current Location: {currentLocation ? 'Available' : 'None'}</div>
                      <div>Drives: {drives?.length || 0}</div>
                      <div>Charges: {charges?.length || 0}</div>
                      <div>Data Source: {isLive ? 'API' : 'Static'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tessie-debug' && (
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-orange-400">Tessie API Debugger</CardTitle>
              </CardHeader>
              <CardContent>
                <TessieApiDebugger />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-pink-400">Media Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaManager />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPortal;
