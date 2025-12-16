import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/StatCard';
import JourneyMap from '@/components/JourneyMap';
import { 
  MapPin, 
  Zap, 
  Navigation, 
  Battery, 
  Plus, 
  LogOut,
  Calendar,
  TrendingUp,
  Car
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
    // For now, we'll use the token from secrets - in production this would be fetched securely
    // The Mapbox token is a public token and can be exposed to the frontend
    const token = import.meta.env.VITE_MAPBOX_TOKEN || '';
    setMapboxToken(token);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const totalMiles = journeys.reduce((sum, j) => sum + Number(j.total_miles), 0);
  const totalKwh = journeys.reduce((sum, j) => sum + Number(j.total_kwh), 0);
  const totalStates = new Set(journeys.map(j => j.id)).size; // Placeholder - would aggregate states_visited
  const efficiency = totalMiles > 0 ? Math.round((totalKwh / totalMiles) * 1000) : 0;

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
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-sunset flex items-center justify-center">
              <Navigation className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">A Whittle Wandering</h1>
              <p className="text-sm text-muted-foreground">Your Tesla Journey Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/journey/new')}>
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
          <h2 className="text-3xl font-display font-bold">
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
            value={totalMiles.toLocaleString()}
            subtitle="Across all journeys"
            icon={Navigation}
            variant="primary"
          />
          <StatCard
            title="Energy Used"
            value={`${totalKwh.toLocaleString()} kWh`}
            subtitle={`${efficiency} Wh/mi avg`}
            icon={Zap}
            variant="secondary"
          />
          <StatCard
            title="States Visited"
            value={journeys.length > 0 ? journeys[0]?.states_count || 0 : 0}
            subtitle="GPS verified"
            icon={MapPin}
          />
          <StatCard
            title="Journeys"
            value={journeys.length}
            subtitle={`${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''}`}
            icon={Car}
          />
        </section>

        {/* Map Section */}
        <section>
          <Card className="shadow-card overflow-hidden">
            <CardHeader>
              <CardTitle className="font-display">Your Journey Map</CardTitle>
              <CardDescription>All your Tesla adventures visualized</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <JourneyMap 
                className="h-[400px]"
                mapboxToken={mapboxToken}
              />
            </CardContent>
          </Card>
        </section>

        {/* Recent Journeys */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-bold">Recent Journeys</h3>
            <Button variant="link" onClick={() => navigate('/journeys')}>
              View all
            </Button>
          </div>

          {journeys.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No journeys yet</h3>
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
              {journeys.slice(0, 6).map((journey) => (
                <Card 
                  key={journey.id} 
                  className="shadow-card hover:shadow-elevated transition-all cursor-pointer group"
                  onClick={() => navigate(`/journey/${journey.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-display font-semibold group-hover:text-primary transition-colors">
                          {journey.name}
                        </h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(journey.start_date).toLocaleDateString()}
                          {journey.end_date && ` - ${new Date(journey.end_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      {journey.is_public && (
                        <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                          Public
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold">{Number(journey.total_miles).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">miles</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{journey.states_count}</p>
                        <p className="text-xs text-muted-foreground">states</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{Number(journey.total_kwh).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">kWh</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-xl font-display font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer" onClick={() => navigate('/vehicles')}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Manage Vehicles</h4>
                  <p className="text-sm text-muted-foreground">Add or edit your Tesla</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer" onClick={() => navigate('/import')}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-secondary/10">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold">Import Data</h4>
                  <p className="text-sm text-muted-foreground">Upload TeslaFi CSV</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer" onClick={() => navigate('/analytics')}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent">
                  <Battery className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold">Analytics</h4>
                  <p className="text-sm text-muted-foreground">Efficiency insights</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
