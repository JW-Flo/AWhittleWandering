import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Navigation,
  Battery,
  Clock,
  Trash2,
  Save,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';

interface ExtractedWaypoint {
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  arrived_at: string;
  departed_at: string | null;
  dwell_minutes: number;
  waypoint_type: string;
  state_code: string;
  battery_on_arrival: number | null;
  odometer_miles: number | null;
  is_highlight: boolean;
  drive_count: number;
}

interface ExtractionResult {
  success: boolean;
  waypoints: ExtractedWaypoint[];
  stats: {
    totalDrives: number;
    dateRange: { from: string; to: string };
    statesCrossed: string[];
    totalMiles: number;
  };
}

export function GPSWaypointRebuild() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [selectedWaypoints, setSelectedWaypoints] = useState<Set<number>>(new Set());
  const [committing, setCommitting] = useState(false);
  const [expandedWaypoint, setExpandedWaypoint] = useState<number | null>(null);
  
  // Extraction parameters
  const [vin, setVin] = useState('5YJYGDEE5LF027324');
  const [fromDate, setFromDate] = useState('2025-06-01');
  const [toDate, setToDate] = useState('2025-12-31');
  const [minDwellMinutes, setMinDwellMinutes] = useState(30);
  const [clusterRadiusMiles, setClusterRadiusMiles] = useState(2);
  const [excludeHome, setExcludeHome] = useState(true);
  const [homeLocation, setHomeLocation] = useState('Monroe, North Carolina');

  const extractWaypoints = async () => {
    setLoading(true);
    setExtractionResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-waypoints', {
        body: {
          vin,
          fromDate,
          toDate,
          minDwellMinutes,
          clusterRadiusMiles,
          excludeHome,
          homeLocation,
          commitToFlagship: false
        }
      });

      if (error) throw error;

      if (data.success && data.waypoints) {
        setExtractionResult(data);
        // Select all waypoints by default
        setSelectedWaypoints(new Set(data.waypoints.map((_: ExtractedWaypoint, i: number) => i)));
        toast({
          title: "Extraction Complete",
          description: `Found ${data.waypoints.length} significant waypoints from ${data.stats.totalDrives} drives`
        });
      } else {
        toast({
          title: "No Waypoints Found",
          description: "No significant stops found with the current parameters",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Failed to extract waypoints",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const commitWaypoints = async () => {
    if (!extractionResult || selectedWaypoints.size === 0) return;
    
    setCommitting(true);
    try {
      const waypointsToCommit = extractionResult.waypoints
        .filter((_, i) => selectedWaypoints.has(i))
        .map((wp, i) => ({
          name: wp.name,
          location: wp.location,
          latitude: wp.latitude,
          longitude: wp.longitude,
          arrived_at: wp.arrived_at,
          departed_at: wp.departed_at,
          dwell_minutes: wp.dwell_minutes,
          waypoint_type: wp.waypoint_type,
          state_code: wp.state_code,
          battery_on_arrival: wp.battery_on_arrival,
          odometer_miles: wp.odometer_miles,
          is_highlight: wp.is_highlight,
          waypoint_number: i + 1
        }));

      // Clear existing waypoints first
      const { error: deleteError } = await supabase
        .from('flagship_waypoints')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Insert new waypoints
      const { error: insertError } = await supabase
        .from('flagship_waypoints')
        .insert(waypointsToCommit);

      if (insertError) throw insertError;

      toast({
        title: "Waypoints Committed",
        description: `Successfully saved ${waypointsToCommit.length} waypoints to flagship_waypoints`
      });

      setExtractionResult(null);
      setSelectedWaypoints(new Set());
    } catch (error) {
      console.error('Commit error:', error);
      toast({
        title: "Commit Failed",
        description: error instanceof Error ? error.message : "Failed to commit waypoints",
        variant: "destructive"
      });
    } finally {
      setCommitting(false);
    }
  };

  const toggleWaypoint = (index: number) => {
    const newSelected = new Set(selectedWaypoints);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedWaypoints(newSelected);
  };

  const selectAll = () => {
    if (extractionResult) {
      setSelectedWaypoints(new Set(extractionResult.waypoints.map((_, i) => i)));
    }
  };

  const selectNone = () => {
    setSelectedWaypoints(new Set());
  };

  const getWaypointTypeBadge = (type: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode }> = {
      start: { className: 'bg-success/20 text-success', icon: <Navigation className="w-3 h-3" /> },
      destination: { className: 'bg-primary/20 text-primary', icon: <MapPin className="w-3 h-3" /> },
      overnight: { className: 'bg-purple-500/20 text-purple-400', icon: <Clock className="w-3 h-3" /> },
      charging: { className: 'bg-amber-500/20 text-amber-400', icon: <Battery className="w-3 h-3" /> },
      stop: { className: 'bg-muted text-muted-foreground', icon: <MapPin className="w-3 h-3" /> }
    };
    const config = variants[type] || variants.stop;
    return (
      <Badge variant="outline" className={config.className}>
        {config.icon}
        <span className="ml-1">{type}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Extraction Parameters */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            GPS Waypoint Extraction
          </CardTitle>
          <CardDescription>
            Extract significant waypoints from Tessie drive data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Vehicle VIN</Label>
              <Input 
                value={vin} 
                onChange={(e) => setVin(e.target.value)}
                placeholder="5YJYGDEE5LF027324"
              />
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Min Dwell Time (minutes)</Label>
              <Input 
                type="number" 
                value={minDwellMinutes} 
                onChange={(e) => setMinDwellMinutes(Number(e.target.value))}
                min={5}
                max={480}
              />
            </div>
            <div className="space-y-2">
              <Label>Cluster Radius (miles)</Label>
              <Input 
                type="number" 
                value={clusterRadiusMiles} 
                onChange={(e) => setClusterRadiusMiles(Number(e.target.value))}
                min={0.5}
                max={10}
                step={0.5}
              />
            </div>
            <div className="space-y-2">
              <Label>Home Location (to exclude)</Label>
              <Input 
                value={homeLocation} 
                onChange={(e) => setHomeLocation(e.target.value)}
                placeholder="Monroe, North Carolina"
                disabled={!excludeHome}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Switch 
                checked={excludeHome} 
                onCheckedChange={setExcludeHome}
                id="exclude-home"
              />
              <Label htmlFor="exclude-home">Exclude home location</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={extractWaypoints} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Extract Waypoints
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extraction Results */}
      {extractionResult && (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Extraction Preview
                </CardTitle>
                <CardDescription>
                  {extractionResult.stats.totalDrives} drives analyzed • {extractionResult.waypoints.length} waypoints found
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-success/10 text-success">
                  {extractionResult.stats.statesCrossed.join(', ')}
                </Badge>
                <Badge variant="outline">
                  {Math.round(extractionResult.stats.totalMiles).toLocaleString()} mi
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone}>
                  Select None
                </Button>
                <span className="text-sm text-muted-foreground ml-2">
                  {selectedWaypoints.size} of {extractionResult.waypoints.length} selected
                </span>
              </div>
              <Button 
                onClick={commitWaypoints} 
                disabled={committing || selectedWaypoints.size === 0}
                className="bg-success hover:bg-success/90"
              >
                {committing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Commit {selectedWaypoints.size} Waypoints
              </Button>
            </div>

            {/* Waypoints List */}
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {extractionResult.waypoints.map((wp, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedWaypoints.has(index) 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-secondary/30 border-border/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedWaypoints.has(index)}
                        onCheckedChange={() => toggleWaypoint(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{index + 1}. {wp.name}</span>
                          {getWaypointTypeBadge(wp.waypoint_type)}
                          <Badge variant="outline" className="text-xs">
                            {wp.state_code}
                          </Badge>
                          {wp.is_highlight && (
                            <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                              Highlight
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {wp.location}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(wp.arrived_at), 'MMM d, h:mm a')}
                          </span>
                          <span>{wp.dwell_minutes} min dwell</span>
                          {wp.battery_on_arrival !== null && (
                            <span className="flex items-center gap-1">
                              <Battery className="w-3 h-3" />
                              {wp.battery_on_arrival}%
                            </span>
                          )}
                          {wp.odometer_miles && (
                            <span>{wp.odometer_miles.toLocaleString()} mi</span>
                          )}
                          <span>{wp.drive_count} drives</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedWaypoint(expandedWaypoint === index ? null : index)}
                      >
                        {expandedWaypoint === index ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {expandedWaypoint === index && (
                      <div className="mt-3 pt-3 border-t border-border/50 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-muted-foreground">Coordinates:</span>{' '}
                            {wp.latitude.toFixed(5)}, {wp.longitude.toFixed(5)}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Arrived:</span>{' '}
                            {format(new Date(wp.arrived_at), 'PPpp')}
                          </div>
                          {wp.departed_at && (
                            <div>
                              <span className="text-muted-foreground">Departed:</span>{' '}
                              {format(new Date(wp.departed_at), 'PPpp')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Current Waypoints Summary */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Current Flagship Waypoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CurrentWaypointsSummary />
        </CardContent>
      </Card>
    </div>
  );
}

function CurrentWaypointsSummary() {
  const [waypoints, setWaypoints] = useState<Array<{ name: string; state_code: string; waypoint_type: string }>>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    const fetchWaypoints = async () => {
      const { data } = await supabase
        .from('flagship_waypoints')
        .select('name, state_code, waypoint_type')
        .order('waypoint_number');
      
      if (data) setWaypoints(data);
      setLoading(false);
    };
    fetchWaypoints();
  });

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (waypoints.length === 0) {
    return <div className="text-sm text-muted-foreground">No waypoints configured</div>;
  }

  const uniqueStates = [...new Set(waypoints.map(w => w.state_code).filter(Boolean))];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline">{waypoints.length} waypoints</Badge>
        <Badge variant="outline" className="bg-success/10 text-success">
          {uniqueStates.length} states
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1">
        {uniqueStates.map(state => (
          <Badge key={state} variant="secondary" className="text-xs">
            {state}
          </Badge>
        ))}
      </div>
    </div>
  );
}
