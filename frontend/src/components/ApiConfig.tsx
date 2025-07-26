// API Configuration component for managing Tessie API credentials
// Provides secure handling of API keys with admin authentication

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Eye, EyeOff, Key, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiConfigProps {
  onApiKeyChange: (apiKey: string) => void;
  onVehicleIdChange: (vehicleId: string) => void;
  currentApiKey?: string;
  currentVehicleId?: string;
}

const ApiConfig: React.FC<ApiConfigProps> = ({
  onApiKeyChange,
  onVehicleIdChange,
  currentApiKey = '',
  currentVehicleId = 'midnightshadow'
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [vehicleId, setVehicleId] = useState(currentVehicleId);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  
  const { isAuthenticated, canModifyJourney } = useAdminAuth();

  // Load saved credentials on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('tessie_api_key');
    const savedVehicleId = localStorage.getItem('tessie_vehicle_id');
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
      onApiKeyChange(savedApiKey);
    }
    
    if (savedVehicleId) {
      setVehicleId(savedVehicleId);
      onVehicleIdChange(savedVehicleId);
    }
  }, [onApiKeyChange, onVehicleIdChange]);

  const handleSaveCredentials = () => {
    if (!canModifyJourney) return;
    
    localStorage.setItem('tessie_api_key', apiKey);
    localStorage.setItem('tessie_vehicle_id', vehicleId);
    
    onApiKeyChange(apiKey);
    onVehicleIdChange(vehicleId);
    
    setTestStatus('success');
    setTestMessage('Credentials saved successfully');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const testConnection = async () => {
    if (!apiKey || !vehicleId) {
      setTestStatus('error');
      setTestMessage('Please provide both API key and vehicle ID');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Testing connection...');

    try {
      const response = await fetch(`https://api.tessie.com/vehicles/${vehicleId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestStatus('success');
        setTestMessage(`Connection successful! Vehicle: ${data.display_name || vehicleId}`);
      } else {
        setTestStatus('error');
        setTestMessage(`Connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setTimeout(() => setTestStatus('idle'), 5000);
  };

  const clearCredentials = () => {
    if (!canModifyJourney) return;
    
    setApiKey('');
    setVehicleId('midnightshadow');
    localStorage.removeItem('tessie_api_key');
    localStorage.removeItem('tessie_vehicle_id');
    
    onApiKeyChange('');
    onVehicleIdChange('midnightshadow');
    
    setTestStatus('idle');
    setTestMessage('');
  };

  if (!isAuthenticated || !canModifyJourney) {
    return (
      <Card className="story-card">
        <CardContent className="p-6 text-center">
          <div className="text-yellow-500 text-2xl mb-2">🔒</div>
          <p className="text-muted-foreground">Admin authentication required to configure API settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="story-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient">
          <Settings className="w-5 h-5" />
          Tessie API Configuration
          <Badge variant="secondary" className="ml-2 bg-tesla-cyan text-xs">Admin Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vehicle ID Configuration */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Vehicle ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              placeholder="Enter vehicle ID (e.g., midnightshadow)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The unique identifier for your Tesla vehicle in Tessie
          </p>
        </div>

        {/* API Key Configuration */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tessie API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Tessie API key"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your API key from your Tessie account dashboard
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSaveCredentials}
            disabled={!apiKey || !vehicleId}
            className="bg-[hsl(var(--adventure-green))] hover:bg-[hsl(var(--adventure-green))/0.9] text-white"
          >
            <Key className="w-4 h-4 mr-2" />
            Save Credentials
          </Button>
          
          <Button 
            onClick={testConnection}
            disabled={!apiKey || !vehicleId || testStatus === 'testing'}
            variant="outline"
          >
            {testStatus === 'testing' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
          
          <Button 
            onClick={clearCredentials}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Clear
          </Button>
        </div>

        {/* Test Status */}
        {testStatus !== 'idle' && (
          <div className={`p-3 rounded-lg ${
            testStatus === 'success' ? 'bg-green-50 border border-green-200' :
            testStatus === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center">
              {testStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mr-2" />}
              {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-600 mr-2" />}
              {testStatus === 'testing' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
              )}
              <span className={`text-sm ${
                testStatus === 'success' ? 'text-green-800' :
                testStatus === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {testMessage}
              </span>
            </div>
          </div>
        )}

        {/* API Information */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-foreground mb-2">About Tessie API</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Tessie provides real-time access to your Tesla vehicle data</p>
            <p>• This includes drive history, charging sessions, and location tracking</p>
            <p>• Your API key is stored locally and used only for this application</p>
            <p>• Visit <a href="https://tessie.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">tessie.com</a> to get your API key</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiConfig;
