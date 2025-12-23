import React, { useState, useEffect } from 'react';
import { useRobustData } from '../hooks/useRobustData';
import { safeTimeString } from '@/utils/dateHelpers';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  timestamp: Date;
  critical: boolean;
}

export function SystemHealthMonitor() {
  const { vehicles, drives, charges, currentLocation, journeyInsights, loading, error, isLive } = useRobustData();
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'degraded' | 'critical'>('healthy');

  const runHealthChecks = () => {
    const checks: HealthCheck[] = [];
    const now = new Date();

    // 1. Data Pipeline Health
    checks.push({
      name: 'Data Pipeline',
      status: loading ? 'warn' : (error ? 'fail' : 'pass'),
      message: loading ? 'Loading data...' : (error ? `Error: ${error}` : 'Data flowing normally'),
      timestamp: now,
      critical: true
    });

    // 2. Live Data Connection
    checks.push({
      name: 'Live Data Connection',
      status: isLive ? 'pass' : 'warn',
      message: isLive ? 'Connected to live Tessie API' : 'Using fallback data - API unavailable',
      timestamp: now,
      critical: false
    });

    // 3. Journey Data Completeness
    const hasJourneyData = journeyInsights && journeyInsights.totalMiles > 0;
    checks.push({
      name: 'Journey Data',
      status: hasJourneyData ? 'pass' : 'fail',
      message: hasJourneyData ? `${journeyInsights.totalMiles} miles tracked` : 'No journey data available',
      timestamp: now,
      critical: true
    });

    // 4. Location Tracking
    const hasLocation = currentLocation && currentLocation.latitude && currentLocation.longitude;
    checks.push({
      name: 'Location Tracking',
      status: hasLocation ? 'pass' : 'fail',
      message: hasLocation ? `Current location: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : 'No location data',
      timestamp: now,
      critical: true
    });

    // 5. Historical Drive Data
    checks.push({
      name: 'Historical Drives',
      status: drives.length > 0 ? 'pass' : 'fail',
      message: `${drives.length} drives recorded`,
      timestamp: now,
      critical: true
    });

    setHealthChecks(checks);

    // Calculate overall health
    const criticalFailures = checks.filter(c => c.critical && c.status === 'fail').length;
    const warnings = checks.filter(c => c.status === 'warn').length;
    
    if (criticalFailures > 0) {
      setOverallHealth('critical');
    } else if (warnings > 2) {
      setOverallHealth('degraded');
    } else {
      setOverallHealth('healthy');
    }
  };

  useEffect(() => {
    runHealthChecks();
    const interval = setInterval(runHealthChecks, 10000);
    return () => clearInterval(interval);
  }, [vehicles, drives, charges, currentLocation, journeyInsights, loading, error, isLive]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-400';
      case 'warn': return 'text-yellow-400';
      case 'fail': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'warn': return '⚠️';
      case 'fail': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${
      overallHealth === 'healthy' ? 'border-green-400 bg-green-900/20' :
      overallHealth === 'degraded' ? 'border-yellow-400 bg-yellow-900/20' :
      'border-red-400 bg-red-900/20'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">System Health Monitor</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          overallHealth === 'healthy' ? 'bg-green-400 text-green-900' :
          overallHealth === 'degraded' ? 'bg-yellow-400 text-yellow-900' :
          'bg-red-400 text-red-900'
        }`}>
          {overallHealth.toUpperCase()}
        </div>
      </div>

      <div className="space-y-3">
        {healthChecks.map((check, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getStatusIcon(check.status)}</span>
              <div>
                <div className={`font-medium ${getStatusColor(check.status)}`}>
                  {check.name} {check.critical && '(Critical)'}
                </div>
                <div className="text-sm text-gray-300">{check.message}</div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {safeTimeString(check.timestamp)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-600">
        <button 
          onClick={runHealthChecks}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          🔄 Run Health Check
        </button>
      </div>
    </div>
  );
}
