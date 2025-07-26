import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTessieApi } from '@/hooks/useTessieApi';

interface DataDebuggerProps {
  tessieApiKey?: string;
}

const DataDebugger: React.FC<DataDebuggerProps> = ({ tessieApiKey }) => {
  const { 
    vehicles, 
    vehicleData, 
    historicalDrives, 
    historicalCharges, 
    isLoading, 
    error 
  } = useTessieApi(tessieApiKey);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">API Status</h4>
            <div className="space-y-1 text-sm">
              <div>Loading: <Badge variant={isLoading ? "destructive" : "default"}>{isLoading ? "Yes" : "No"}</Badge></div>
              <div>Error: <Badge variant={error ? "destructive" : "default"}>{error || "None"}</Badge></div>
              <div>API Key: <Badge variant={tessieApiKey ? "default" : "destructive"}>{tessieApiKey ? "Set" : "Missing"}</Badge></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Data Counts</h4>
            <div className="space-y-1 text-sm">
              <div>Vehicles: <Badge>{vehicles.length}</Badge></div>
              <div>Historical Drives: <Badge>{historicalDrives.length}</Badge></div>
              <div>Historical Charges: <Badge>{historicalCharges.length}</Badge></div>
              <div>Vehicle Data: <Badge variant={vehicleData ? "default" : "destructive"}>{vehicleData ? "Available" : "Missing"}</Badge></div>
            </div>
          </div>
        </div>

        {historicalDrives.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Sample Drive Data</h4>
            <div className="bg-muted p-3 rounded text-xs font-mono">
              <pre>{JSON.stringify(historicalDrives[0], null, 2)}</pre>
            </div>
          </div>
        )}

        {historicalCharges.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Sample Charge Data</h4>
            <div className="bg-muted p-3 rounded text-xs font-mono">
              <pre>{JSON.stringify(historicalCharges[0], null, 2)}</pre>
            </div>
          </div>
        )}

        {vehicleData && (
          <div>
            <h4 className="font-medium mb-2">Current Vehicle Data</h4>
            <div className="bg-muted p-3 rounded text-xs font-mono">
              <pre>{JSON.stringify(vehicleData, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataDebugger;
