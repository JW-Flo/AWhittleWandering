import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

// Lazy load the map component to reduce initial bundle size
const TeslaMap = lazy(() => import('./TeslaMap'));

interface VehicleLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

interface LazyTeslaMapProps {
  vehicleLocation?: VehicleLocation;
  mapboxToken?: string;
  onTokenChange?: (token: string) => void;
  routeLocations?: Array<{lat: number, lng: number, timestamp: string}>;
  routePoints?: Array<{lat: number, lng: number, timestamp: string}>;
}

const MapLoadingFallback = () => (
  <Card className="h-96">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Loading Map...
      </CardTitle>
    </CardHeader>
    <CardContent className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </CardContent>
  </Card>
);

const LazyTeslaMap: React.FC<LazyTeslaMapProps> = (props) => {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <TeslaMap {...props} />
    </Suspense>
  );
};

export default LazyTeslaMap;
