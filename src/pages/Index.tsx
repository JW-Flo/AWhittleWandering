import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import ImmersiveJourneyMap from '@/components/ImmersiveJourneyMap';
import SignInDialog from '@/components/SignInDialog';
import FeatureRequestWidget from '@/components/FeatureRequestWidget';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/Logo';
import { SEOHead, flagshipJourneyJsonLd, organizationJsonLd } from '@/components/SEOHead';
import {
  Navigation, 
  MapPin, 
  Zap, 
  ArrowRight,
  ChevronDown,
  Car,
  Calendar,
  Route,
  Globe,
  Users,
  Trophy,
  Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Combined JSON-LD for homepage
const homepageJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [organizationJsonLd, flagshipJourneyJsonLd]
};

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [mapboxToken, setMapboxToken] = useState('');
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    // Use public token from env directly
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (token) {
      setMapboxToken(token);
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Car className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }

  if (user) {
    navigate('/explore');
    return null;
  }

  const handleSignInClick = () => {
    setSignInOpen(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex flex-col">
      <SEOHead 
        title="A Whittle Wandering - 48 State Tesla Road Trip Adventure"
        description="Follow the 89-day journey across all 48 contiguous United States in a Tesla Model Y. 15,847 miles, 6,915 kWh, 259 charging sessions. Track your own EV adventures."
        jsonLd={homepageJsonLd}
      />
      
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <Logo size="sm" showText={false} />
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/explore')}
                className="hidden sm:flex"
              >
                Explore Journey
              </Button>
              <Button 
                size="sm"
                onClick={handleSignInClick}
                className="rounded-full"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Immersive Hero - Full Screen */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* PNW Atmospheric Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-twilight-green/90 via-background to-background" />
        
        {/* Subtle nature-inspired orbs - organic and floating */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Soft glowing orbs like filtered sunlight through trees */}
          <div 
            className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle, hsl(var(--moss-bright)) 0%, transparent 70%)',
              top: '10%',
              left: '-10%',
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          />
          <div 
            className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
            style={{
              background: 'radial-gradient(circle, hsl(var(--ancient-teal)) 0%, transparent 70%)',
              top: '30%',
              right: '-5%',
              transform: `translateY(${scrollY * 0.15}px)`,
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 60%)',
              bottom: '10%',
              left: '30%',
              transform: `translateY(${-scrollY * 0.08}px)`,
            }}
          />
          
          {/* Subtle forest particles/fireflies effect */}
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, hsl(var(--sunbeam) / 0.3) 1px, transparent 1px),
                               radial-gradient(circle at 70% 60%, hsl(var(--sunbeam) / 0.2) 1px, transparent 1px),
                               radial-gradient(circle at 40% 80%, hsl(var(--moss-bright) / 0.2) 1px, transparent 1px)`,
              backgroundSize: '100px 100px, 150px 150px, 80px 80px',
            }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 container mx-auto px-6 md:px-8 text-center">
          <div className="max-w-5xl mx-auto space-y-8">
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
              className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-bold tracking-tight animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <span className="block text-foreground">A Whittle</span>
              <span className="block text-gradient-sunset">Wandering</span>
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
              className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              <Button 
                size="lg" 
                className="text-lg px-10 py-6 rounded-full shadow-glow hover:shadow-elevated transition-all duration-300"
                onClick={handleSignInClick}
              >
                Follow the Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6 rounded-full"
                onClick={() => navigate('/explore')}
              >
                <Globe className="mr-2 w-5 h-5" />
                Preview Map
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

          <div className="grid grid-cols-2 gap-4 sm:gap-8 md:grid-cols-4 max-w-5xl mx-auto">
            {/* Miles */}
            <div className="text-center group">
              <div className="relative">
                <p className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-gradient-sunset">
                  15,847
                </p>
                <Route className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 text-sunset/50 group-hover:text-sunset transition-colors" />
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">Miles Traveled</p>
            </div>

            {/* States */}
            <div className="text-center group">
              <div className="relative">
                <p className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-forest">
                  48
                </p>
                <MapPin className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 text-forest/50 group-hover:text-forest transition-colors" />
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">States Visited</p>
            </div>

            {/* kWh */}
            <div className="text-center group">
              <div className="relative">
                <p className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-primary">
                  6,915
                </p>
                <Zap className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 text-primary/50 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">kWh Consumed</p>
            </div>

            {/* Days */}
            <div className="text-center group">
              <div className="relative">
                <p className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-sand">
                  89
                </p>
                <Calendar className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 text-sand/50 group-hover:text-sand transition-colors" />
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">Days on the Road</p>
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

      {/* Features Preview */}
      <section className="py-24 bg-card/50 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Track Your Own <span className="text-gradient-primary">Adventures</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AWW isn't just about our journey — it's a platform for all adventurers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Interactive Maps</h3>
              <p className="text-muted-foreground">
                Watch your journey unfold in real-time with beautiful 3D terrain maps and animated route playback.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-forest/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-forest/10 flex items-center justify-center mb-4 group-hover:bg-forest/20 transition-colors">
                <Zap className="w-6 h-6 text-forest" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Rich Analytics</h3>
              <p className="text-muted-foreground">
                Track energy consumption, charging patterns, efficiency metrics, and compare with other adventurers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card rounded-2xl border border-border p-6 hover:border-sunset/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-sunset/10 flex items-center justify-center mb-4 group-hover:bg-sunset/20 transition-colors">
                <Users className="w-6 h-6 text-sunset" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Share & Follow</h3>
              <p className="text-muted-foreground">
                Share your journey with friends and family. Get notifications when you cross state lines.
              </p>
            </div>
          </div>

          {/* Leaderboard Teaser */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-milestone border border-primary/20">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">Compete on the Leaderboard</span>
              <Sparkles className="w-5 h-5 text-primary" />
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
              onClick={handleSignInClick}
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

          {/* Inline Sign-In Dialog */}
          <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
        </div>
      </section>

      {/* Feature Request Widget */}
      <FeatureRequestWidget variant="floating" />

      {/* Footer */}
      <Footer />
    </div>
  );
}
