import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Mic, 
  Camera, 
  X, 
  MapPin,
  Clock,
  Mountain,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleState {
  latitude: number;
  longitude: number;
  speed?: number;
  batteryLevel?: number;
}

interface LocationInfo {
  name: string;
  type: 'vista' | 'attraction' | 'city' | 'nature' | 'generic';
  dwellMinutes: number;
}

interface MemoryPromptWidgetProps {
  vehicleState: VehicleState | null;
  journeyId: string;
  onRecordVoice: () => void;
  onUploadPhotos: () => void;
  className?: string;
}

// Notable locations database (simplified - in production, use a real POI API)
const NOTABLE_LOCATIONS = [
  { lat: 37.7749, lng: -122.4194, name: 'San Francisco', type: 'city' as const },
  { lat: 36.1069, lng: -112.1129, name: 'Grand Canyon', type: 'vista' as const },
  { lat: 40.7128, lng: -74.0060, name: 'New York City', type: 'city' as const },
  { lat: 36.0544, lng: -112.1401, name: 'Grand Canyon South Rim', type: 'vista' as const },
  { lat: 37.8651, lng: -119.5383, name: 'Yosemite Valley', type: 'vista' as const },
  { lat: 44.4280, lng: -110.5885, name: 'Old Faithful', type: 'attraction' as const },
  { lat: 25.7617, lng: -80.1918, name: 'Miami', type: 'city' as const },
  { lat: 47.6062, lng: -122.3321, name: 'Seattle', type: 'city' as const },
  { lat: 36.1699, lng: -115.1398, name: 'Las Vegas', type: 'city' as const },
  { lat: 38.8977, lng: -77.0365, name: 'Washington D.C.', type: 'city' as const },
  { lat: 39.7392, lng: -104.9903, name: 'Denver', type: 'city' as const },
  { lat: 34.0522, lng: -118.2437, name: 'Los Angeles', type: 'city' as const },
  { lat: 41.8781, lng: -87.6298, name: 'Chicago', type: 'city' as const },
  { lat: 29.7604, lng: -95.3698, name: 'Houston', type: 'city' as const },
  { lat: 33.4484, lng: -112.0740, name: 'Phoenix', type: 'city' as const },
  { lat: 38.2527, lng: -85.7585, name: 'Louisville', type: 'city' as const },
  { lat: 35.2271, lng: -80.8431, name: 'Charlotte', type: 'city' as const },
  { lat: 32.7767, lng: -96.7970, name: 'Dallas', type: 'city' as const },
  { lat: 45.5152, lng: -122.6784, name: 'Portland', type: 'city' as const },
  { lat: 37.3382, lng: -121.8863, name: 'San Jose', type: 'city' as const },
];

const DWELL_THRESHOLD_MINUTES = 30; // Prompt after 30 minutes at a location

const MemoryPromptWidget: React.FC<MemoryPromptWidgetProps> = ({
  vehicleState,
  journeyId,
  onRecordVoice,
  onUploadPhotos,
  className
}) => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [dwellStartTime, setDwellStartTime] = useState<number | null>(null);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Calculate distance between two coordinates (in km)
  const getDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Find nearby notable location
  const findNearbyLocation = useCallback((lat: number, lng: number): { name: string; type: 'vista' | 'attraction' | 'city' | 'nature' | 'generic' } | null => {
    for (const loc of NOTABLE_LOCATIONS) {
      const distance = getDistance(lat, lng, loc.lat, loc.lng);
      // Within 15km for cities, 5km for attractions/vistas
      const threshold = loc.type === 'city' ? 15 : 5;
      if (distance <= threshold) {
        return { name: loc.name, type: loc.type };
      }
    }
    return null;
  }, [getDistance]);

  // Check if user is stationary (speed < 5 mph or position unchanged)
  const isStationary = useCallback((current: VehicleState) => {
    if (current.speed !== undefined && current.speed < 5) return true;
    if (lastLocation) {
      const distance = getDistance(
        current.latitude, 
        current.longitude, 
        lastLocation.lat, 
        lastLocation.lng
      );
      return distance < 0.1; // Less than 100m movement
    }
    return false;
  }, [lastLocation, getDistance]);

  // Monitor vehicle state for long stays
  useEffect(() => {
    if (!vehicleState || dismissed) return;

    const stationary = isStationary(vehicleState);

    if (stationary) {
      if (!dwellStartTime) {
        // Start tracking dwell time
        setDwellStartTime(Date.now());
        setLastLocation({ lat: vehicleState.latitude, lng: vehicleState.longitude });
      } else {
        // Check dwell duration
        const dwellMinutes = (Date.now() - dwellStartTime) / (1000 * 60);
        
        if (dwellMinutes >= DWELL_THRESHOLD_MINUTES && !showPrompt) {
          // Check if at a notable location
          const nearby = findNearbyLocation(vehicleState.latitude, vehicleState.longitude);
          
          if (nearby) {
            setLocationInfo({
              name: nearby.name,
              type: nearby.type,
              dwellMinutes: Math.floor(dwellMinutes)
            });
            setShowPrompt(true);
          } else if (dwellMinutes >= 60) {
            // Even without a known location, prompt after 1 hour
            setLocationInfo({
              name: 'this location',
              type: 'generic',
              dwellMinutes: Math.floor(dwellMinutes)
            });
            setShowPrompt(true);
          }
        }
      }
    } else {
      // Vehicle is moving, reset dwell tracking
      if (dwellStartTime) {
        setDwellStartTime(null);
        setShowPrompt(false);
        setLocationInfo(null);
        setDismissed(false);
      }
      setLastLocation({ lat: vehicleState.latitude, lng: vehicleState.longitude });
    }
  }, [vehicleState, dwellStartTime, showPrompt, dismissed, isStationary, findNearbyLocation]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'vista': return Mountain;
      case 'attraction': return Sparkles;
      case 'city': return Building2;
      default: return MapPin;
    }
  };

  const getPromptMessage = () => {
    if (!locationInfo) return '';
    
    const { name, type, dwellMinutes } = locationInfo;
    const duration = dwellMinutes >= 60 
      ? `${Math.floor(dwellMinutes / 60)}h ${dwellMinutes % 60}m` 
      : `${dwellMinutes}m`;

    switch (type) {
      case 'vista':
        return `You've been enjoying ${name} for ${duration}. This view deserves a memory!`;
      case 'attraction':
        return `${duration} at ${name}! Don't forget to capture this moment.`;
      case 'city':
        return `Exploring ${name} for ${duration}. What's catching your eye?`;
      default:
        return `You've been at ${name} for ${duration}. Worth a quick note?`;
    }
  };

  if (!showPrompt || !locationInfo) return null;

  const LocationIcon = getLocationIcon(locationInfo.type);

  return (
    <Card className={cn(
      "border-sunset/50 bg-gradient-to-r from-sunset/10 to-primary/10 animate-in slide-in-from-bottom-4 duration-500",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-sunset/20">
            <Sparkles className="w-5 h-5 text-sunset" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">Capture This Moment</h4>
                  <Badge variant="outline" className="text-xs">
                    <LocationIcon className="w-3 h-3 mr-1" />
                    {locationInfo.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getPromptMessage()}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 -mt-1 -mr-1"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{locationInfo.dwellMinutes}+ minutes at this location</span>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={onRecordVoice}
                className="gap-2"
              >
                <Mic className="w-4 h-4" />
                Record Voice Note
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onUploadPhotos}
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                Add Photos
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemoryPromptWidget;
