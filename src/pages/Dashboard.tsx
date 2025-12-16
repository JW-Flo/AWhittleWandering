import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/StatCard';
import JourneyMap from '@/components/JourneyMap';
import AdvancedAnalyticsDashboard from '@/components/AdvancedAnalyticsDashboard';
import JourneyTimeline from '@/components/JourneyTimeline';
import MediaGallery from '@/components/MediaGallery';
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
  Map
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchData();
    fetchMapboxToken();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [journeysRes, vehiclesRes] = await Promise.all([
        supabase.from('journeys').select('*').order('start_date', { ascending: false }),
        supabase.from('vehicles').select('*'),
      ]);

      if (journeysRes.data) setJourneys(journeysRes.data);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      if (data?.token) {
        setMapboxToken(data.token);
      }
    } catch (error) {
      console.error('Error fetching Mapbox token:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const totalMiles = journeys.reduce((sum, j) => sum + Number(j.total_miles), 0);
  const totalKwh = journeys.reduce((sum, j) => sum + Number(j.total_kwh), 0);
  const totalStates = journeys.length > 0 ? journeys[0]?.states_count || 48 : 0;
  const efficiency = totalMiles > 0 ? Math.round((totalKwh / totalMiles) * 1000) : 436;

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
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Navigation className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">A Whittle Wandering</h1>
              <p className="text-sm text-muted-foreground">Your Tesla Journey Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/journey/new')} className="border-border">
              <Plus className="w-4 h-4 mr-2" />
              New Journey
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
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
            title="Journeys"
            value={journeys.length > 0 ? journeys.length : 1}
            subtitle={`${vehicles.length || 1} vehicle${vehicles.length !== 1 ? 's' : ''}`}
            icon={Car}
          />
        </section>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-secondary">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              <span className="hidden md:inline">Overview</span>
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
            <TabsTrigger value="journeys" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              <span className="hidden md:inline">Journeys</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Map Section */}
            <Card className="card-tesla overflow-hidden">
              <CardHeader>
                <CardTitle className="text-gradient-primary">Your Journey Map</CardTitle>
                <CardDescription>All your Tesla adventures visualized</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <JourneyMap 
                  className="h-[500px]"
                  mapboxToken={mapboxToken}
                />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="card-tesla">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-tesla-blue/10">
                    <TrendingUp className="w-6 h-6 text-tesla-blue" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">259 Charging Sessions</h4>
                    <p className="text-sm text-muted-foreground">$7.13 avg cost</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-tesla">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-adventure-green/10">
                    <Battery className="w-6 h-6 text-adventure-green" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">2.29 mi/kWh</h4>
                    <p className="text-sm text-muted-foreground">Average efficiency</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-tesla">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-adventure-orange/10">
                    <Calendar className="w-6 h-6 text-adventure-orange" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">89 Days</h4>
                    <p className="text-sm text-muted-foreground">June 3 - Aug 31, 2025</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdvancedAnalyticsDashboard />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <JourneyTimeline />
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media">
            <MediaGallery />
          </TabsContent>

          {/* Journeys Tab */}
          <TabsContent value="journeys" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Your Journeys</h3>
              <Button onClick={() => navigate('/journey/new')}>
                <Plus className="w-4 h-4 mr-2" />
                New Journey
              </Button>
            </div>

            {journeys.length === 0 ? (
              <Card className="card-tesla">
                <CardContent className="py-12 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">No journeys yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking your Tesla adventures by creating your first journey.
                  </p>
                  <Button onClick={() => navigate('/journey/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Journey
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {journeys.map((journey) => (
                  <Card 
                    key={journey.id} 
                    className="card-tesla cursor-pointer group"
                    onClick={() => navigate(`/journey/${journey.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {journey.name}
                          </h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(journey.start_date).toLocaleDateString()}
                            {journey.end_date && ` - ${new Date(journey.end_date).toLocaleDateString()}`}
                          </p>
                        </div>
                        {journey.is_public && (
                          <span className="text-xs bg-adventure-green/20 text-adventure-green px-2 py-1 rounded-full">
                            Public
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-foreground">{Number(journey.total_miles).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">miles</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{journey.states_count}</p>
                          <p className="text-xs text-muted-foreground">states</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{Number(journey.total_kwh).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">kWh</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
