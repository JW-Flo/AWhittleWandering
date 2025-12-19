import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFlagshipGating } from '@/hooks/useFlagshipGating';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/StatCard';
import ImmersiveJourneyMap from '@/components/ImmersiveJourneyMap';
import AdvancedAnalyticsDashboard from '@/components/AdvancedAnalyticsDashboard';
import JourneyTimeline from '@/components/JourneyTimeline';
import MediaGallery from '@/components/MediaGallery';
import FloatingVehicleWidget from '@/components/FloatingVehicleWidget';
import LiveVehicleStatus from '@/components/LiveVehicleStatus';
import WeatherOverlay from '@/components/WeatherOverlay';
import StatesProgressMap from '@/components/StatesProgressMap';
import CSVImport from '@/components/CSVImport';
import PhotoUpload from '@/components/PhotoUpload';
import FlagshipGate from '@/components/FlagshipGate';
import RouteNavigator from '@/components/RouteNavigator';
import VoiceJournal from '@/components/journey/VoiceJournal';
import { JourneyList } from '@/components/journey/JourneyList';
import { LoginAlertsBanner } from '@/components/LoginAlertsBanner';
import { useTessieData } from '@/hooks/useTessieData';
import { 
  MapPin, 
  Zap, 
  Navigation, 
  Battery, 
  Plus, 
  LogOut,
  Calendar,
  TrendingUp,
  Car,
  BarChart3,
  Image,
  Map,
  Database,
  Activity,
  Compass,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Journey {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  total_miles: number;
  total_kwh: number;
  states_count: number;
  is_public: boolean;
}

interface Vehicle {
  id: string;
  nickname: string;
  model: string | null;
  year: number | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { hasViewedFlagship } = useFlagshipGating();
  const { logPageView, logTabChange } = useActivityLogger();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [driveDataCount, setDriveDataCount] = useState(0);
  
  const { vehicleState } = useTessieData(undefined, true, 60000);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    logPageView('/dashboard');
    fetchData();
    fetchMapboxToken();
  }, [user, navigate, logPageView]);

  const fetchData = async () => {
    try {
      const [journeysRes, vehiclesRes, driveDataRes] = await Promise.all([
        supabase.from('journeys').select('*').order('start_date', { ascending: false }),
        supabase.from('vehicles').select('*'),
        supabase.from('drive_data').select('id', { count: 'exact', head: true }),
      ]);

      if (journeysRes.data) setJourneys(journeysRes.data);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (driveDataRes.count !== null) setDriveDataCount(driveDataRes.count);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMapboxToken = async () => {
    // Always fetch from edge function (token is stored as secret)
    try {
      console.log('[Dashboard] Fetching mapbox token from edge function...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        console.error('[Dashboard] Edge function error:', error);
        toast({
          title: "Map Loading Error",
          description: "Could not load map credentials. Please try refreshing.",
          variant: "destructive"
        });
        return;
      }
      
      if (data?.token) {
        console.log('[Dashboard] Got mapbox token from edge function');
        setMapboxToken(data.token);
      } else {
        console.warn('[Dashboard] No token in response:', data);
      }
    } catch (err) {
      console.error('[Dashboard] Failed to fetch mapbox token:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const totalMiles = journeys.reduce((sum, j) => sum + Number(j.total_miles), 0);
  const totalKwh = journeys.reduce((sum, j) => sum + Number(j.total_kwh), 0);
  const totalStates = journeys.length > 0 ? journeys[0]?.states_count || 48 : 48;
  const efficiency = totalMiles > 0 ? Math.round((totalKwh / totalMiles) * 1000) : 436;

  // Get current journey for CSV import
  const currentJourney = journeys[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Navigation className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading your journeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Vehicle Widget */}
      <FloatingVehicleWidget />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Navigation className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AWW Dashboard</h1>
              <p className="text-sm text-muted-foreground">Adventure Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/leaderboard')} className="hidden md:flex">
              <TrendingUp className="w-4 h-4 mr-1" />
              Leaderboard
            </Button>
            
            {/* Show explore button if not viewed flagship */}
            {!hasViewedFlagship && (
              <Button variant="outline" onClick={() => navigate('/explore')} className="border-sunset text-sunset hover:bg-sunset/10">
                <Compass className="w-4 h-4 mr-2" />
                Explore AWW
              </Button>
            )}
            
            {hasViewedFlagship && (
              <Button variant="outline" onClick={() => navigate('/journey/new')} className="border-border">
                <Plus className="w-4 h-4 mr-2" />
                New Journey
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} title="Admin Portal">
              <Car className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Login Security Alerts */}
        <LoginAlertsBanner />

        {/* Welcome Section */}
        <section className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
          </h2>
          <p className="text-muted-foreground">
            Track your adventures, analyze your efficiency, and share your stories.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Miles"
            value={totalMiles > 0 ? totalMiles.toLocaleString() : '15,847'}
            subtitle="Across all journeys"
            icon={Navigation}
            variant="primary"
          />
          <StatCard
            title="Energy Used"
            value={`${totalKwh > 0 ? totalKwh.toLocaleString() : '6,915'} kWh`}
            subtitle={`${efficiency} Wh/mi avg`}
            icon={Zap}
            variant="secondary"
          />
          <StatCard
            title="States Visited"
            value={totalStates}
            subtitle="GPS verified"
            icon={MapPin}
          />
          <StatCard
            title="GPS Points"
            value={driveDataCount > 0 ? driveDataCount.toLocaleString() : '85,000+'}
            subtitle="Telemetry records"
            icon={Activity}
          />
        </section>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={(tab) => { setActiveTab(tab); logTabChange(`dashboard_${tab}`); }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-secondary">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="journeys" className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              <span className="hidden md:inline">Journeys</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden md:inline">Live</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden md:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              <span className="hidden md:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden md:inline">Data</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Map Section */}
            <Card className="card-tesla overflow-hidden">
              <CardHeader>
                <CardTitle className="text-gradient-primary">48-State Journey Map</CardTitle>
                <CardDescription>Interactive exploration of your complete route</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {mapboxToken ? (
                  <div className="relative">
                    <ImmersiveJourneyMap 
                      className="h-[500px]"
                      mapboxToken={mapboxToken}
                    />
                  </div>
                ) : (
                  <div className="h-[500px] relative overflow-hidden bg-gradient-to-br from-muted/30 via-muted/50 to-muted/30">
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    
                    {/* Map placeholder content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                          <Map className="w-8 h-8 text-primary" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-accent-foreground animate-ping" />
                        </div>
                      </div>
                      <p className="mt-4 text-sm font-medium text-muted-foreground">Loading journey map...</p>
                      <p className="text-xs text-muted-foreground/60">Fetching Mapbox credentials</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={fetchMapboxToken}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                    
                    {/* Decorative map grid lines */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-1/4 left-0 right-0 h-px bg-border" />
                      <div className="absolute top-2/4 left-0 right-0 h-px bg-border" />
                      <div className="absolute top-3/4 left-0 right-0 h-px bg-border" />
                      <div className="absolute left-1/4 top-0 bottom-0 w-px bg-border" />
                      <div className="absolute left-2/4 top-0 bottom-0 w-px bg-border" />
                      <div className="absolute left-3/4 top-0 bottom-0 w-px bg-border" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* States Progress */}
            <StatesProgressMap animate={true} showDetails={true} />

            {/* Quick Stats and Route Navigator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="card-tesla">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">259 Charging Sessions</h4>
                      <p className="text-sm text-muted-foreground">$7.13 avg cost</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-tesla">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-success/10">
                      <Battery className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">2.29 mi/kWh</h4>
                      <p className="text-sm text-muted-foreground">Average efficiency</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-tesla">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-warning/10">
                      <Calendar className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">89 Days</h4>
                      <p className="text-sm text-muted-foreground">June 3 - Aug 31, 2025</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* AI Route Navigator POC */}
              <RouteNavigator className="h-full min-h-[400px]" />
            </div>
          </TabsContent>

          {/* Journeys Tab - Manage your journeys */}
          <TabsContent value="journeys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary" />
                  Your Journeys
                </CardTitle>
                <CardDescription>
                  Manage, export, archive, or delete your journey data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JourneyList />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Tab - Real-time vehicle data */}
          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <LiveVehicleStatus />
                
                {/* Voice Journal for Active Journeys */}
                {currentJourney && (
                  <VoiceJournal 
                    journeyId={currentJourney.id}
                    currentWaypoint={vehicleState ? {
                      name: 'Current Location',
                      latitude: vehicleState.latitude,
                      longitude: vehicleState.longitude
                    } : null}
                    onEntrySaved={() => toast({ title: "Memory saved!", description: "Your voice note has been added to your journey." })}
                  />
                )}
              </div>
              
              {/* Weather Overlay */}
              {vehicleState && (
                <WeatherOverlay 
                  lat={vehicleState.latitude} 
                  lng={vehicleState.longitude}
                  locationName="Current Location"
                />
              )}
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Real-Time Tracking
                </CardTitle>
                <CardDescription>
                  Live data from your Tesla via Tessie API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">How it works</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Tessie polls your vehicle every 30 seconds</li>
                    <li>• Battery, location, and temperature data are updated live</li>
                    <li>• Drive and charge sessions are automatically logged</li>
                    <li>• Historical data is available for analysis</li>
                  </ul>
                </div>
                
                {vehicleState && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-1">Current Status</p>
                    <p className="text-2xl font-bold">
                      {vehicleState.batteryLevel}% Battery
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ~{Math.round(vehicleState.batteryRange)} mi range remaining
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Live Map with current location */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Live Location</CardTitle>
                <CardDescription>
                  {vehicleState ? `${vehicleState.latitude.toFixed(4)}, ${vehicleState.longitude.toFixed(4)}` : 'Waiting for vehicle data...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[400px]">
                {mapboxToken ? (
                  <ImmersiveJourneyMap 
                    className="h-full"
                    mapboxToken={mapboxToken}
                    showCenterButton={true}
                    userLocation={vehicleState ? { lat: vehicleState.latitude, lng: vehicleState.longitude } : null}
                  />
                ) : (
                  <div className="h-full relative overflow-hidden bg-gradient-to-br from-muted/30 via-muted/50 to-muted/30">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                        <Activity className="w-6 h-6 text-primary" />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">Loading live map...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdvancedAnalyticsDashboard />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <JourneyTimeline 
              currentLocation={vehicleState ? { lat: vehicleState.latitude, lng: vehicleState.longitude } : null}
              batteryLevel={vehicleState?.batteryLevel}
              isCharging={vehicleState?.isCharging}
            />
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            {/* Media Library Access Button */}
            <Card className="card-tesla border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Image className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Import from Device</h4>
                    <p className="text-sm text-muted-foreground">Access photos and videos from your device library</p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = 'image/*,video/*';
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0) {
                        toast({
                          title: `${files.length} file(s) selected`,
                          description: 'Ready to upload to your journey'
                        });
                      }
                    };
                    input.click();
                  }}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Browse Library
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MediaGallery journeyId={currentJourney?.id} />
              </div>
              <div>
                {currentJourney && (
                  <PhotoUpload 
                    journeyId={currentJourney.id}
                    onUploadComplete={() => {
                      toast({
                        title: 'Photos Uploaded',
                        description: 'Your media has been saved and synced'
                      });
                    }}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Data Tab - API Connection First */}
          <TabsContent value="data" className="space-y-6">
            {/* API Connection - Primary */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Vehicle API Connection
                </CardTitle>
                <CardDescription>
                  Connect your vehicle API for automatic data sync - no manual imports needed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
                    <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold">Tessie</h4>
                    <p className="text-xs text-muted-foreground">Tesla vehicles</p>
                    <Badge variant="outline" className="mt-2 text-xs border-primary text-primary">Recommended</Badge>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center opacity-60">
                    <Car className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <h4 className="font-semibold">Smartcar</h4>
                    <p className="text-xs text-muted-foreground">Multiple brands</p>
                    <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center opacity-60">
                    <Car className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <h4 className="font-semibold">Tesla Fleet</h4>
                    <p className="text-xs text-muted-foreground">Direct Tesla API</p>
                    <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
                  </div>
                </div>
                
                {!currentJourney ? (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-muted-foreground mb-4">
                      Create a journey to connect your vehicle API
                    </p>
                    <Button onClick={() => navigate('/journey/new')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Journey
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-600">Tessie API Connected</p>
                        <p className="text-sm text-muted-foreground">Shadowfax • Live tracking enabled</p>
                      </div>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Flagship Journey Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Flagship Journey Data
                  </CardTitle>
                  <CardDescription>A Whittle Wandering statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
                      <p className="text-3xl font-bold text-primary">89,163</p>
                      <p className="text-sm text-muted-foreground">GPS Points</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
                      <p className="text-3xl font-bold text-primary">73</p>
                      <p className="text-sm text-muted-foreground">Waypoints</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-muted/50 rounded text-center">
                      <p className="font-bold">48</p>
                      <p className="text-xs text-muted-foreground">States</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded text-center">
                      <p className="font-bold">259</p>
                      <p className="text-xs text-muted-foreground">Charges</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded text-center">
                      <p className="font-bold">89</p>
                      <p className="text-xs text-muted-foreground">Days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CSV Import - Secondary/Advanced */}
              <Card className="border-dashed">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-muted-foreground">Advanced: CSV Import</CardTitle>
                    <Badge variant="outline" className="text-xs">Power Users</Badge>
                  </div>
                  <CardDescription>
                    For historical data backfill only. API connection is preferred.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentJourney ? (
                    <CSVImport 
                      journeyId={currentJourney.id}
                      onImportComplete={(count) => {
                        setDriveDataCount(prev => prev + count);
                        toast({
                          title: 'Import Complete',
                          description: `Added ${count.toLocaleString()} GPS points`
                        });
                      }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Create a journey first to enable CSV import.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
