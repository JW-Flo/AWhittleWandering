import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bug, Eye, EyeOff } from 'lucide-react';

interface Vehicle {
  id: string;
  display_name: string;
  state: string;
  vin: string;
}

interface VehicleData {
  battery_level: number;
  battery_range: number;
  charging_state: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface DebugInfoProps {
  tessieApiKey?: string | null;
  mapboxToken?: string | null;
  isDemoMode?: boolean;
  vehicles?: Vehicle[];
  vehicleData?: VehicleData | null;
  historicalDrives?: any[];
  historicalCharges?: any[];
  error?: string | null;
}

const DebugInfo: React.FC<DebugInfoProps> = ({
  tessieApiKey,
  mapboxToken,
  isDemoMode,
  vehicles = [],
  vehicleData,
  historicalDrives = [],
  historicalCharges = [],
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  const maskKey = (key?: string | null) => {
    if (!key) return 'Not set';
    if (!showSensitive) return `${key.slice(0, 8)}${'*'.repeat(Math.max(0, key.length - 8))}`;
    return key;
  };

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bug className="w-4 h-4" />
          Debug
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="absolute top-full right-0 z-50 mt-2">
        <Card className="w-96 max-h-96 overflow-auto">
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              Debug Information
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSensitive(!showSensitive)}
                className="h-6 w-6 p-0"
              >
                {showSensitive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium text-xs text-muted-foreground">Current State</h4>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex justify-between">
                  <span>Tessie API:</span>
                  <Badge variant={tessieApiKey ? "default" : "destructive"} className="text-xs">
                    {tessieApiKey ? "Set" : "Missing"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Mapbox Token:</span>
                  <Badge variant={mapboxToken ? "default" : "destructive"} className="text-xs">
                    {mapboxToken ? "Set" : "Missing"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Demo Mode:</span>
                  <Badge variant={isDemoMode ? "default" : "outline"} className="text-xs">
                    {isDemoMode ? "ON" : "OFF"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Vehicles:</span>
                  <span>{vehicles.length} found</span>
                </div>
                <div className="flex justify-between">
                  <span>Historical Drives:</span>
                  <span>{historicalDrives.length} loaded</span>
                </div>
                <div className="flex justify-between">
                  <span>Historical Charges:</span>
                  <span>{historicalCharges.length} loaded</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-xs text-muted-foreground">Environment Variables</h4>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex justify-between">
                  <span>VITE_TESSIE_API_KEY:</span>
                  <Badge variant={envVars.tessieKey ? "default" : "destructive"} className="text-xs">
                    {envVars.tessieKey ? "Set" : "Missing"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>VITE_MAPBOX_TOKEN:</span>
                  <Badge variant={envVars.mapboxToken ? "default" : "destructive"} className="text-xs">
                    {envVars.mapboxToken ? "Set" : "Missing"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>VITE_API_BASE_URL:</span>
                  <Badge variant={envVars.apiBaseUrl ? "default" : "destructive"} className="text-xs">
                    {envVars.apiBaseUrl ? "Set" : "Missing"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-xs text-muted-foreground">Local Storage</h4>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex justify-between">
                  <span>tessie_api_key:</span>
                  <Badge variant={storageKeys.tessieKey ? "default" : "secondary"} className="text-xs">
                    {storageKeys.tessieKey ? "Set" : "Not Set"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>mapbox_token:</span>
                  <Badge variant={storageKeys.mapboxToken ? "default" : "secondary"} className="text-xs">
                    {storageKeys.mapboxToken ? "Set" : "Not Set"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>demo_mode:</span>
                  <Badge variant={storageKeys.demoMode === 'true' ? "default" : "secondary"} className="text-xs">
                    {storageKeys.demoMode || 'false'}
                  </Badge>
                </div>
              </div>
            </div>

            {error && (
              <div className="space-y-2">
                <h4 className="font-medium text-xs text-destructive">Error</h4>
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                  {error}
                </div>
              </div>
            )}

            {vehicleData && (
              <div className="space-y-2">
                <h4 className="font-medium text-xs text-muted-foreground">Vehicle Data</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>Battery: {vehicleData.battery_level}%</div>
                  <div>Range: {vehicleData.battery_range}mi</div>
                  <div>Lat: {vehicleData.latitude.toFixed(4)}</div>
                  <div>Lng: {vehicleData.longitude.toFixed(4)}</div>
                  <div>State: {vehicleData.charging_state}</div>
                  <div>Updated: {new Date(vehicleData.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            )}

            {showSensitive && (
              <div className="space-y-2">
                <h4 className="font-medium text-xs text-muted-foreground">Sensitive Data</h4>
                <div className="p-2 bg-muted rounded text-xs font-mono space-y-1">
                  <div>Current Tessie: {maskKey(tessieApiKey)}</div>
                  <div>Current Mapbox: {maskKey(mapboxToken)}</div>
                  <div>Env Tessie: {maskKey(envVars.tessieKey)}</div>
                  <div>Env Mapbox: {maskKey(envVars.mapboxToken)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DebugInfo;
