import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import ImmersiveJourneyMap from '@/components/ImmersiveJourneyMap';
import {
  Navigation, 
  MapPin, 
  Zap, 
  ArrowRight,
  ChevronDown,
  Car,
  Calendar,
  Route
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [mapboxToken, setMapboxToken] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    fetchMapboxToken();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Car className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }

  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Immersive Hero - Full Screen */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-road/90 via-background to-background" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, hsl(var(--sunset)) 0%, transparent 50%),
                             radial-gradient(circle at 80% 30%, hsl(var(--forest)) 0%, transparent 40%),
                             radial-gradient(circle at 50% 80%, hsl(var(--primary)) 0%, transparent 30%)`
          }}
        />
        
        {/* Floating road lines animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute left-1/2 top-0 w-1 h-full bg-gradient-to-b from-sand/0 via-sand/40 to-sand/0"
            style={{ transform: `translateY(${scrollY * 0.5}px)` }}
          />
          <div 
            className="absolute left-[calc(50%-4px)] top-0 w-8 border-l-2 border-r-2 border-dashed border-sand/20 h-full"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium">Summer 2025 • 89 Days</span>
            </div>

            {/* Title */}
            <h1 
              className="text-6xl md:text-8xl lg:text-9xl font-display font-bold tracking-tight animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <span className="block text-gradient-sunset">AWW</span>
            </h1>

            {/* Subtitle */}
            <p 
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              One Tesla. One summer. Forty-eight states.
              <br />
              <span className="text-foreground/80">Follow the adventure.</span>
            </p>

            {/* CTA */}
            <div 
              className="pt-4 animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              <Button 
                size="lg" 
                className="text-lg px-10 py-6 rounded-full shadow-glow hover:shadow-elevated transition-all duration-300"
                onClick={() => navigate('/auth')}
              >
                Follow the Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-muted-foreground" />
        </div>
      </section>

      {/* Journey Stats - Dramatic Numbers */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card to-background" />
        
        <div className="relative container mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-display font-bold mb-16">
            The Numbers Behind the Adventure
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {/* Miles */}
            <div className="text-center group">
              <div className="relative">
                <p className="text-5xl md:text-7xl font-display font-bold text-gradient-sunset">
                  15,847
                </p>
                <Route className="absolute -top-2 -right-2 w-6 h-6 text-sunset/50 group-hover:text-sunset transition-colors" />
              </div>
              <p className="text-muted-foreground mt-2 font-medium">Miles Traveled</p>
            </div>

            {/* States */}
            <div className="text-center group">
              <div className="relative">
                <p className="text-5xl md:text-7xl font-display font-bold text-forest">
                  48
                </p>
                <MapPin className="absolute -top-2 -right-2 w-6 h-6 text-forest/50 group-hover:text-forest transition-colors" />
              </div>
              <p className="text-muted-foreground mt-2 font-medium">States Visited</p>
            </div>

            {/* kWh */}
            <div className="text-center group">
              <div className="relative">
                <p className="text-5xl md:text-7xl font-display font-bold text-primary">
                  6,915
                </p>
                <Zap className="absolute -top-2 -right-2 w-6 h-6 text-primary/50 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-muted-foreground mt-2 font-medium">kWh Consumed</p>
            </div>

            {/* Days */}
            <div className="text-center group">
              <div className="relative">
                <p className="text-5xl md:text-7xl font-display font-bold text-sand">
                  89
                </p>
                <Calendar className="absolute -top-2 -right-2 w-6 h-6 text-sand/50 group-hover:text-sand transition-colors" />
              </div>
              <p className="text-muted-foreground mt-2 font-medium">Days on the Road</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Story */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-display font-bold">
              The <span className="text-gradient-sunset">Story</span>
            </h2>
            
            <div className="prose prose-lg prose-invert mx-auto text-muted-foreground">
              <p className="text-xl leading-relaxed">
                In the summer of 2025, we set out to do something extraordinary — 
                visit all 48 contiguous United States in a single Tesla Model Y named <strong className="text-forest">Shadowfax</strong>.
              </p>
              <p className="text-xl leading-relaxed">
                From the humid shores of Corpus Christi to the rugged peaks of Montana, 
                through desert heat and mountain passes, this is the complete record of that journey. 
                Every mile tracked. Every charge logged. Every memory captured.
              </p>
            </div>

            {/* Vehicle Card */}
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-card border border-border shadow-card">
              <div className="w-12 h-12 rounded-full bg-forest/20 flex items-center justify-center">
                <Car className="w-6 h-6 text-forest" />
              </div>
              <div className="text-left">
                <p className="font-display font-semibold text-foreground">Tesla Model Y "Shadowfax"</p>
                <p className="text-sm text-muted-foreground">436 Wh/mi average • 259 charging sessions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Route Preview Placeholder */}
      <section className="py-24 bg-card relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e65c00' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Follow Every Mile
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Interactive maps, real-time data, and the complete story of an unforgettable summer.
          </p>

          <div className="max-w-6xl mx-auto aspect-[16/10] rounded-2xl overflow-hidden border border-border shadow-elevated">
            {mapboxToken ? (
              <ImmersiveJourneyMap 
                className="h-full w-full"
                mapboxToken={mapboxToken}
              />
            ) : (
              <div className="h-full w-full bg-background/50 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Navigation className="w-16 h-16 text-primary mx-auto animate-pulse" />
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-road/50 to-transparent" />
        
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Ready to{' '}
            <span className="text-gradient-sunset">Explore?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Sign in to see the full journey, explore the interactive map, 
            and dive into the data behind the adventure.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="text-lg px-10 py-6 rounded-full shadow-glow"
              onClick={() => navigate('/auth')}
            >
              Start Exploring
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="lg"
              className="text-lg px-8"
              onClick={() => navigate('/explore')}
            >
              View Public Journey
            </Button>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-border/50 py-8 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-sunset flex items-center justify-center">
                <Navigation className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">AWW</span>
            </div>
            <p className="text-sm text-muted-foreground">
              June 3 – August 31, 2025 • 48 States • 100% Electric
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
