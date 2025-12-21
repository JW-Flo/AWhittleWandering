import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Navigation, 
  Car, 
  MapPin, 
  ExternalLink, 
  Copy, 
  Send,
  Loader2,
  Smartphone
} from 'lucide-react';

interface Waypoint {
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

interface RouteExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waypoints: Waypoint[];
  routeName?: string;
}

export default function RouteExportDialog({
  open,
  onOpenChange,
  waypoints,
  routeName = 'Route'
}: RouteExportDialogProps) {
  const [sending, setSending] = useState(false);
  const [teslaVin, setTeslaVin] = useState('');

  // Generate Apple Maps URL with waypoints
  const generateAppleMapsUrl = () => {
    if (waypoints.length === 0) return '';
    
    // Apple Maps uses dirflg for routing and waypoints in the daddr parameter
    const start = waypoints[0];
    const end = waypoints[waypoints.length - 1];
    const middleWaypoints = waypoints.slice(1, -1);
    
    let url = `https://maps.apple.com/?`;
    url += `saddr=${start.lat},${start.lng}`;
    url += `&daddr=${end.lat},${end.lng}`;
    
    // Add waypoints as stops
    if (middleWaypoints.length > 0) {
      const waypointParams = middleWaypoints
        .map(wp => `${wp.lat},${wp.lng}`)
        .join('+to:');
      url += `+to:${waypointParams}`;
    }
    
    url += `&dirflg=d`; // Driving directions
    return url;
  };

  // Generate Google Maps URL with waypoints
  const generateGoogleMapsUrl = () => {
    if (waypoints.length === 0) return '';
    
    const start = waypoints[0];
    const end = waypoints[waypoints.length - 1];
    const middleWaypoints = waypoints.slice(1, -1);
    
    let url = `https://www.google.com/maps/dir/`;
    url += `${start.lat},${start.lng}/`;
    
    // Add all middle waypoints
    middleWaypoints.forEach(wp => {
      url += `${wp.lat},${wp.lng}/`;
    });
    
    url += `${end.lat},${end.lng}`;
    url += `?travelmode=driving`;
    
    return url;
  };

  // Generate Waze URL
  const generateWazeUrl = () => {
    if (waypoints.length === 0) return '';
    
    const destination = waypoints[waypoints.length - 1];
    return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
  };

  // Generate waypoints JSON for copying
  const generateWaypointsJson = () => {
    return JSON.stringify(waypoints.map(wp => ({
      name: wp.name,
      coordinates: { lat: wp.lat, lng: wp.lng },
      address: wp.address
    })), null, 2);
  };

  // Send route to Tesla via Tessie API
  const sendToTesla = async () => {
    if (!teslaVin) {
      toast.error('Please enter your Tesla VIN or select a vehicle');
      return;
    }

    if (waypoints.length === 0) {
      toast.error('No waypoints to send');
      return;
    }

    setSending(true);
    try {
      // Get user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to send routes to your Tesla');
        return;
      }

      // Send destination to Tesla via Tessie API
      const destination = waypoints[waypoints.length - 1];
      
      const response = await supabase.functions.invoke('tessie', {
        body: {
          action: 'navigate',
          vin: teslaVin,
          latitude: destination.lat,
          longitude: destination.lng,
          // Include intermediate waypoints as supercharger stops if applicable
          waypoints: waypoints.slice(0, -1).map(wp => ({
            lat: wp.lat,
            lng: wp.lng,
            name: wp.name
          }))
        }
      });

      if (response.error) throw response.error;
      
      toast.success('Route sent to your Tesla! Check your vehicle navigation.');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending to Tesla:', error);
      toast.error('Failed to send route to Tesla. Make sure your vehicle is connected.');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const openUrl = (url: string) => {
    window.open(url, '_blank');
  };

  const appleMapsUrl = generateAppleMapsUrl();
  const googleMapsUrl = generateGoogleMapsUrl();
  const wazeUrl = generateWazeUrl();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Export Route
          </DialogTitle>
          <DialogDescription>
            Send this route to your preferred navigation app or directly to your Tesla.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Waypoints Summary */}
          <Card className="bg-secondary/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{routeName}</span>
                <Badge variant="outline">{waypoints.length} stops</Badge>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {waypoints.slice(0, 5).map((wp, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{wp.name}</span>
                  </div>
                ))}
                {waypoints.length > 5 && (
                  <span className="text-xs text-muted-foreground">
                    +{waypoints.length - 5} more stops
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Apps */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Open in Navigation App</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => openUrl(appleMapsUrl)}
                disabled={!appleMapsUrl}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">Apple Maps</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => openUrl(googleMapsUrl)}
                disabled={!googleMapsUrl}
              >
                <MapPin className="w-5 h-5" />
                <span className="text-xs">Google Maps</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => openUrl(wazeUrl)}
                disabled={!wazeUrl}
              >
                <Navigation className="w-5 h-5" />
                <span className="text-xs">Waze</span>
              </Button>
            </div>
          </div>

          {/* Send to Tesla */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Send to Tesla</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter VIN or vehicle ID"
                value={teslaVin}
                onChange={(e) => setTeslaVin(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={sendToTesla}
                disabled={sending || !teslaVin}
                className="shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Car className="w-4 h-4 mr-1" />
                    Send
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Requires Tessie integration. Vehicle must be awake.
            </p>
          </div>

          {/* Copy Options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Copy Links</Label>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => copyToClipboard(appleMapsUrl, 'Apple Maps link')}
              >
                <Copy className="w-3 h-3 mr-2" />
                Copy Apple Maps URL
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => copyToClipboard(googleMapsUrl, 'Google Maps link')}
              >
                <Copy className="w-3 h-3 mr-2" />
                Copy Google Maps URL
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => copyToClipboard(generateWaypointsJson(), 'Waypoints JSON')}
              >
                <Copy className="w-3 h-3 mr-2" />
                Copy Waypoints JSON
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}