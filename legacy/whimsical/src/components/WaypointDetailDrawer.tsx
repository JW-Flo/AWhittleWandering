import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Mountain, 
  Route, 
  Zap, 
  Camera,
  Thermometer,
  Navigation
} from "lucide-react";
import { JourneyWaypoint } from "@/data/journeyRoute";

interface WaypointDetailDrawerProps {
  waypoint: JourneyWaypoint | null;
  isOpen: boolean;
  onClose: () => void;
  waypointIndex?: number;
  totalWaypoints?: number;
}

const getTypeInfo = (type: string) => {
  switch (type) {
    case 'start': return { label: 'Journey Start', color: 'bg-forest text-white' };
    case 'highlight': return { label: 'Highlight', color: 'bg-sunset text-white' };
    case 'charging': return { label: 'Charging Stop', color: 'bg-primary text-primary-foreground' };
    case 'waypoint': return { label: 'Waypoint', color: 'bg-sand text-road' };
    case 'stop': return { label: 'Stop', color: 'bg-muted text-muted-foreground' };
    default: return { label: type, color: 'bg-secondary text-secondary-foreground' };
  }
};

export default function WaypointDetailDrawer({ 
  waypoint, 
  isOpen, 
  onClose,
  waypointIndex,
  totalWaypoints 
}: WaypointDetailDrawerProps) {
  if (!waypoint) return null;

  const typeInfo = getTypeInfo(waypoint.type);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
              <Badge variant="outline">{waypoint.state}</Badge>
              {waypointIndex !== undefined && totalWaypoints && (
                <Badge variant="secondary" className="ml-auto">
                  Stop {waypointIndex + 1} of {totalWaypoints}
                </Badge>
              )}
            </div>
            <DrawerTitle className="text-2xl font-display">
              {waypoint.name}
            </DrawerTitle>
            <DrawerDescription className="text-base">
              {waypoint.description}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-8 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Date</span>
                </div>
                <p className="font-semibold text-foreground">{waypoint.date}</p>
              </div>

              {waypoint.miles && (
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Route className="w-4 h-4" />
                    <span className="text-xs font-medium">Distance</span>
                  </div>
                  <p className="font-semibold text-foreground">{waypoint.miles.toLocaleString()} mi</p>
                </div>
              )}

              {waypoint.elevation && (
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Mountain className="w-4 h-4" />
                    <span className="text-xs font-medium">Elevation</span>
                  </div>
                  <p className="font-semibold text-foreground">{waypoint.elevation.toLocaleString()} ft</p>
                </div>
              )}

              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Navigation className="w-4 h-4" />
                  <span className="text-xs font-medium">Coordinates</span>
                </div>
                <p className="font-mono text-xs text-foreground">
                  {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                </p>
              </div>
            </div>

            {/* Type-specific content */}
            {waypoint.type === 'charging' && (
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">Charging Stop</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Supercharger stop for Shadowfax. Perfect time to stretch legs and explore.
                </p>
              </div>
            )}

            {waypoint.type === 'highlight' && (
              <div className="bg-sunset/10 rounded-xl p-4 border border-sunset/20">
                <div className="flex items-center gap-2 text-sunset mb-2">
                  <Camera className="w-5 h-5" />
                  <span className="font-semibold">Journey Highlight</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  One of the memorable stops on the AWW adventure.
                </p>
              </div>
            )}

            {waypoint.type === 'start' && (
              <div className="bg-forest/10 rounded-xl p-4 border border-forest/20">
                <div className="flex items-center gap-2 text-forest mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="font-semibold">Journey Origin</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Where the 48-state adventure began. 89 days, 15,847 miles ahead.
                </p>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
