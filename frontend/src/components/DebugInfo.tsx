import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DebugInfo: React.FC = () => {
  const envVars = {
    tessieKey: import.meta.env.VITE_TESSIE_API_KEY,
    mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  };

  const storageKeys = {
    tessieKey: localStorage.getItem('tessie_api_key'),
    mapboxToken: localStorage.getItem('mapbox_token'),
    demoMode: localStorage.getItem('demo_mode'),
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="text-sm font-medium mb-2">Environment Variables:</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>TESSIE_API_KEY:</span>
              <Badge variant={envVars.tessieKey ? "default" : "destructive"}>
                {envVars.tessieKey ? `${envVars.tessieKey.slice(0, 8)}...` : 'Missing'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>MAPBOX_TOKEN:</span>
              <Badge variant={envVars.mapboxToken ? "default" : "destructive"}>
                {envVars.mapboxToken ? `${envVars.mapboxToken.slice(0, 8)}...` : 'Missing'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>API_BASE_URL:</span>
              <Badge variant={envVars.apiBaseUrl ? "default" : "destructive"}>
                {envVars.apiBaseUrl || 'Missing'}
              </Badge>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Local Storage:</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>tessie_api_key:</span>
              <Badge variant={storageKeys.tessieKey ? "default" : "secondary"}>
                {storageKeys.tessieKey ? `${storageKeys.tessieKey.slice(0, 8)}...` : 'Not Set'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>mapbox_token:</span>
              <Badge variant={storageKeys.mapboxToken ? "default" : "secondary"}>
                {storageKeys.mapboxToken ? `${storageKeys.mapboxToken.slice(0, 8)}...` : 'Not Set'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>demo_mode:</span>
              <Badge variant={storageKeys.demoMode === 'true' ? "default" : "secondary"}>
                {storageKeys.demoMode || 'false'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugInfo;
