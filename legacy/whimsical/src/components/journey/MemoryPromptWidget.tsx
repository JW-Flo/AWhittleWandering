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

// Notable locations database - cities, national parks, monuments, and attractions
const NOTABLE_LOCATIONS = [
  // Major Cities
  { lat: 37.7749, lng: -122.4194, name: 'San Francisco', type: 'city' as const },
  { lat: 40.7128, lng: -74.0060, name: 'New York City', type: 'city' as const },
  { lat: 25.7617, lng: -80.1918, name: 'Miami', type: 'city' as const },
  { lat: 47.6062, lng: -122.3321, name: 'Seattle', type: 'city' as const },
  { lat: 36.1699, lng: -115.1398, name: 'Las Vegas', type: 'city' as const },
  { lat: 38.8977, lng: -77.0365, name: 'Washington D.C.', type: 'city' as const },
  { lat: 39.7392, lng: -104.9903, name: 'Denver', type: 'city' as const },
  { lat: 34.0522, lng: -118.2437, name: 'Los Angeles', type: 'city' as const },
  { lat: 41.8781, lng: -87.6298, name: 'Chicago', type: 'city' as const },
  { lat: 29.7604, lng: -95.3698, name: 'Houston', type: 'city' as const },
  { lat: 33.4484, lng: -112.0740, name: 'Phoenix', type: 'city' as const },
  { lat: 32.7767, lng: -96.7970, name: 'Dallas', type: 'city' as const },
  { lat: 45.5152, lng: -122.6784, name: 'Portland', type: 'city' as const },
  { lat: 30.2672, lng: -97.7431, name: 'Austin', type: 'city' as const },
  { lat: 42.3601, lng: -71.0589, name: 'Boston', type: 'city' as const },
  { lat: 29.9511, lng: -90.0715, name: 'New Orleans', type: 'city' as const },
  { lat: 35.2271, lng: -80.8431, name: 'Charlotte', type: 'city' as const },
  { lat: 33.7490, lng: -84.3880, name: 'Atlanta', type: 'city' as const },
  { lat: 39.0997, lng: -94.5786, name: 'Kansas City', type: 'city' as const },
  { lat: 32.7157, lng: -117.1611, name: 'San Diego', type: 'city' as const },
  { lat: 36.1627, lng: -86.7816, name: 'Nashville', type: 'city' as const },
  { lat: 35.0844, lng: -106.6504, name: 'Albuquerque', type: 'city' as const },
  { lat: 35.4676, lng: -97.5164, name: 'Oklahoma City', type: 'city' as const },
  { lat: 44.9778, lng: -93.2650, name: 'Minneapolis', type: 'city' as const },
  
  // National Parks
  { lat: 36.1069, lng: -112.1129, name: 'Grand Canyon', type: 'vista' as const },
  { lat: 36.0544, lng: -112.1401, name: 'Grand Canyon South Rim', type: 'vista' as const },
  { lat: 37.8651, lng: -119.5383, name: 'Yosemite Valley', type: 'vista' as const },
  { lat: 37.7486, lng: -119.5890, name: 'Yosemite National Park', type: 'vista' as const },
  { lat: 44.4280, lng: -110.5885, name: 'Old Faithful', type: 'attraction' as const },
  { lat: 44.4605, lng: -110.8281, name: 'Yellowstone National Park', type: 'nature' as const },
  { lat: 36.4864, lng: -117.1628, name: 'Death Valley', type: 'vista' as const },
  { lat: 36.2400, lng: -116.8258, name: 'Badwater Basin', type: 'vista' as const },
  { lat: 38.2972, lng: -109.5728, name: 'Arches National Park', type: 'vista' as const },
  { lat: 38.5733, lng: -109.5498, name: 'Delicate Arch', type: 'vista' as const },
  { lat: 37.5930, lng: -112.1871, name: 'Bryce Canyon', type: 'vista' as const },
  { lat: 37.2982, lng: -113.0263, name: 'Zion National Park', type: 'vista' as const },
  { lat: 38.7331, lng: -109.5925, name: 'Canyonlands', type: 'vista' as const },
  { lat: 36.8629, lng: -111.3743, name: 'Horseshoe Bend', type: 'vista' as const },
  { lat: 36.8619, lng: -111.5100, name: 'Antelope Canyon', type: 'vista' as const },
  { lat: 35.6853, lng: -105.9371, name: 'Santa Fe', type: 'city' as const },
  { lat: 35.6426, lng: -105.8544, name: 'Meow Wolf Santa Fe', type: 'attraction' as const },
  { lat: 32.1479, lng: -110.7878, name: 'Saguaro National Park', type: 'nature' as const },
  { lat: 31.9083, lng: -104.8609, name: 'Guadalupe Mountains', type: 'vista' as const },
  { lat: 32.1750, lng: -104.4419, name: 'Carlsbad Caverns', type: 'attraction' as const },
  { lat: 29.3275, lng: -103.2425, name: 'Big Bend National Park', type: 'vista' as const },
  { lat: 43.7904, lng: -110.6818, name: 'Grand Teton', type: 'vista' as const },
  { lat: 48.7596, lng: -113.7870, name: 'Glacier National Park', type: 'vista' as const },
  { lat: 46.8523, lng: -121.7603, name: 'Mount Rainier', type: 'vista' as const },
  { lat: 42.9446, lng: -122.1090, name: 'Crater Lake', type: 'vista' as const },
  { lat: 36.4555, lng: -118.8355, name: 'Sequoia National Park', type: 'nature' as const },
  { lat: 36.5859, lng: -118.7511, name: 'General Sherman Tree', type: 'attraction' as const },
  { lat: 41.3111, lng: -81.5477, name: 'Cuyahoga Valley', type: 'nature' as const },
  { lat: 44.0389, lng: -71.2412, name: 'White Mountains', type: 'vista' as const },
  { lat: 44.3386, lng: -68.2733, name: 'Acadia National Park', type: 'vista' as const },
  { lat: 44.3601, lng: -68.2108, name: 'Cadillac Mountain', type: 'vista' as const },
  { lat: 35.6115, lng: -83.5490, name: 'Great Smoky Mountains', type: 'vista' as const },
  { lat: 35.6117, lng: -83.4895, name: 'Clingmans Dome', type: 'vista' as const },
  { lat: 37.7301, lng: -78.8986, name: 'Shenandoah', type: 'nature' as const },
  { lat: 25.1305, lng: -80.9220, name: 'Everglades', type: 'nature' as const },
  { lat: 41.2400, lng: -124.0046, name: 'Redwood National Park', type: 'nature' as const },
  { lat: 34.0206, lng: -116.8352, name: 'Joshua Tree', type: 'nature' as const },
  
  // Famous Monuments & Landmarks
  { lat: 38.8893, lng: -77.0502, name: 'Lincoln Memorial', type: 'attraction' as const },
  { lat: 38.8895, lng: -77.0353, name: 'Washington Monument', type: 'attraction' as const },
  { lat: 40.6892, lng: -74.0445, name: 'Statue of Liberty', type: 'attraction' as const },
  { lat: 36.9914, lng: -109.0452, name: 'Four Corners Monument', type: 'attraction' as const },
  { lat: 43.8791, lng: -103.4591, name: 'Mount Rushmore', type: 'attraction' as const },
  { lat: 43.8360, lng: -103.4793, name: 'Crazy Horse Memorial', type: 'attraction' as const },
  { lat: 43.8554, lng: -103.4557, name: 'Badlands', type: 'vista' as const },
  { lat: 44.5890, lng: -103.4615, name: 'Devils Tower', type: 'vista' as const },
  { lat: 36.0099, lng: -114.7372, name: 'Hoover Dam', type: 'attraction' as const },
  { lat: 37.2309, lng: -122.3831, name: 'Pigeon Point Lighthouse', type: 'vista' as const },
  { lat: 34.0195, lng: -118.4912, name: 'Santa Monica Pier', type: 'attraction' as const },
  { lat: 37.8199, lng: -122.4783, name: 'Golden Gate Bridge', type: 'vista' as const },
  { lat: 32.7555, lng: -97.3308, name: 'Fort Worth Stockyards', type: 'attraction' as const },
  { lat: 29.4241, lng: -98.4936, name: 'The Alamo', type: 'attraction' as const },
  { lat: 29.4272, lng: -98.4869, name: 'River Walk San Antonio', type: 'attraction' as const },
  { lat: 27.8616, lng: -82.4546, name: 'Sunshine Skyway Bridge', type: 'vista' as const },
  { lat: 24.5551, lng: -81.7800, name: 'Key West', type: 'city' as const },
  { lat: 24.6948, lng: -81.4540, name: 'Seven Mile Bridge', type: 'vista' as const },
  { lat: 30.3960, lng: -88.8853, name: 'Gulf Shores', type: 'nature' as const },
  
  // Roadside Attractions & Quirky Stops
  { lat: 35.1858, lng: -101.4527, name: 'Cadillac Ranch', type: 'attraction' as const },
  { lat: 35.1483, lng: -106.8858, name: 'Route 66 Neon Signs', type: 'attraction' as const },
  { lat: 36.9241, lng: -111.4604, name: 'Vermilion Cliffs', type: 'vista' as const },
  { lat: 35.3475, lng: -111.6513, name: 'Meteor Crater', type: 'attraction' as const },
  { lat: 35.2233, lng: -109.0627, name: 'Petrified Forest', type: 'nature' as const },
  { lat: 35.0486, lng: -109.7875, name: 'Painted Desert', type: 'vista' as const },
  { lat: 37.5788, lng: -112.5608, name: 'Red Canyon', type: 'vista' as const },
  { lat: 35.6870, lng: -117.3942, name: 'Trona Pinnacles', type: 'vista' as const },
  { lat: 36.5049, lng: -116.8663, name: 'Zabriskie Point', type: 'vista' as const },
  { lat: 32.8795, lng: -117.2475, name: 'La Jolla Cove', type: 'vista' as const },
  { lat: 34.0259, lng: -118.7798, name: 'Malibu Beach', type: 'vista' as const },
  { lat: 36.2466, lng: -121.8078, name: 'Big Sur', type: 'vista' as const },
  { lat: 36.6082, lng: -121.9018, name: 'Monterey Bay', type: 'vista' as const },
  { lat: 35.4200, lng: -120.8460, name: 'Hearst Castle Area', type: 'attraction' as const },
  { lat: 27.7676, lng: -82.6403, name: 'Salvador Dali Museum', type: 'attraction' as const },
  { lat: 41.4054, lng: -2.1734, name: 'South of the Border (SC)', type: 'attraction' as const },
  { lat: 34.0738, lng: -80.9280, name: 'South of the Border', type: 'attraction' as const },
  { lat: 43.6532, lng: -70.2543, name: 'Portland Head Light', type: 'vista' as const },
  { lat: 28.3772, lng: -81.5707, name: 'Walt Disney World', type: 'attraction' as const },
  { lat: 28.4729, lng: -81.4680, name: 'Universal Studios Orlando', type: 'attraction' as const },
  { lat: 28.4160, lng: -81.5811, name: 'Magic Kingdom', type: 'attraction' as const },
  { lat: 33.8121, lng: -117.9190, name: 'Disneyland', type: 'attraction' as const },
  { lat: 36.1146, lng: -115.1728, name: 'Las Vegas Strip', type: 'attraction' as const },
  { lat: 40.7580, lng: -73.9855, name: 'Times Square', type: 'attraction' as const },
  { lat: 40.7527, lng: -73.9772, name: 'Grand Central Terminal', type: 'attraction' as const },
  { lat: 40.7484, lng: -73.9857, name: 'Empire State Building', type: 'vista' as const },
  { lat: 40.7587, lng: -73.9787, name: 'Rockefeller Center', type: 'attraction' as const },
  { lat: 40.7614, lng: -73.9776, name: 'Museum of Modern Art', type: 'attraction' as const },
  { lat: 40.7794, lng: -73.9632, name: 'The Met', type: 'attraction' as const },
  { lat: 40.7829, lng: -73.9654, name: 'Central Park', type: 'nature' as const },
  { lat: 41.8826, lng: -87.6233, name: 'Millennium Park', type: 'attraction' as const },
  { lat: 41.8827, lng: -87.6233, name: 'Cloud Gate (The Bean)', type: 'attraction' as const },
  { lat: 47.6205, lng: -122.3493, name: 'Space Needle', type: 'vista' as const },
  { lat: 37.8267, lng: -122.4233, name: 'Alcatraz Island', type: 'attraction' as const },
  { lat: 37.8024, lng: -122.4058, name: 'Fishermans Wharf', type: 'attraction' as const },
  { lat: 39.9042, lng: -75.1663, name: 'Independence Hall', type: 'attraction' as const },
  { lat: 39.9526, lng: -75.1652, name: 'Philadelphia', type: 'city' as const },
  { lat: 38.6270, lng: -90.1994, name: 'Gateway Arch', type: 'attraction' as const },
  { lat: 38.6270, lng: -90.1994, name: 'St. Louis', type: 'city' as const },
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
