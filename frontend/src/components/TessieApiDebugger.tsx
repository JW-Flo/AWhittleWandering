import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ApiTestResult {
  endpoint: string;
  method: string;
  status?: number;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

interface TessieApiDebuggerProps {
  apiKey?: string | null;
}

const TessieApiDebugger: React.FC<TessieApiDebuggerProps> = ({ apiKey }) => {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: Omit<ApiTestResult, 'timestamp'>) => {
    setTestResults(prev => [...prev, {
      ...result,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testApiCall = async (endpoint: string, description: string) => {
    if (!apiKey) {
      addResult({
        endpoint,
        method: 'GET',
        success: false,
        error: 'No API key provided'
      });
      return null;
    }

    try {
      console.warn(`Testing: ${description} - ${endpoint}`);
      
      const response = await fetch(`https://api.tessie.com/${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      addResult({
        endpoint,
        method: 'GET',
        status: response.status,
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : `${response.status} ${response.statusText}: ${responseText}`
      });

      return response.ok ? data : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({
        endpoint,
        method: 'GET',
        success: false,
        error: errorMessage
      });
      return null;
    }
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setTestResults([]);

    console.warn('Starting Tessie API debugging...');

    // Test 1: Basic connectivity
    await testApiCall('', 'Basic API connectivity');

    // Test 2: Get vehicles
    const vehicles = await testApiCall('vehicles', 'Get vehicles list');

    if (vehicles && vehicles.results && vehicles.results.length > 0) {
      const firstVehicle = vehicles.results[0];
      const vin = firstVehicle.vin;
      
      if (vin) {
        // Test 3: Get vehicle state
        await testApiCall(`${vin}/state`, 'Get vehicle state');

        // Test 4: Get drives
        const startDate = '2025-06-01';
        const endDate = new Date().toISOString().split('T')[0];
        await testApiCall(`${vin}/drives?start_date=${startDate}&end_date=${endDate}`, 'Get historical drives');

        // Test 5: Get charges
        await testApiCall(`${vin}/charges?start_date=${startDate}&end_date=${endDate}`, 'Get historical charges');
      }
    }

    setIsRunning(false);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Tessie API Debugger
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            onClick={runFullTest} 
            disabled={isRunning || !apiKey}
            className="gap-2"
          >
            {isRunning ? 'Testing...' : 'Run API Tests'}
          </Button>
          <Badge variant={apiKey ? "default" : "destructive"}>
            API Key: {apiKey ? 'Provided' : 'Missing'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {testResults.length === 0 && !isRunning && (
          <p className="text-muted-foreground text-center py-8">
            Click "Run API Tests" to debug Tessie API connectivity
          </p>
        )}

        {testResults.map((result, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="font-medium">{result.endpoint || 'Root endpoint'}</span>
                <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                  {result.status || 'No Response'}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">{result.timestamp}</span>
            </div>

            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 text-sm font-medium">Error:</p>
                <p className="text-red-700 text-xs font-mono">{result.error}</p>
              </div>
            )}

            {result.data && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-green-800 text-sm font-medium">Response:</p>
                <Textarea
                  value={JSON.stringify(result.data, null, 2)}
                  readOnly
                  className="mt-2 font-mono text-xs bg-white min-h-[100px]"
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TessieApiDebugger;
