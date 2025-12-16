import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Navigation, 
  MapPin, 
  Zap, 
  Battery, 
  ArrowRight,
  Star,
  Map,
  BarChart3
} from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navigation className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-sunset mb-4">
              <Navigation className="w-10 h-10 text-primary-foreground" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight">
              A Whittle{' '}
              <span className="text-gradient-sunset">Wandering</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your Tesla adventures across America. Visualize your journeys, 
              analyze efficiency, and share your stories with fellow EV enthusiasts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="text-lg px-8"
                onClick={() => navigate('/auth')}
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8"
                onClick={() => navigate('/explore')}
              >
                Explore Public Journeys
              </Button>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-primary">48</p>
                <p className="text-sm text-muted-foreground">States to Explore</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-secondary">∞</p>
                <p className="text-sm text-muted-foreground">Miles of Adventure</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-sunset">100%</p>
                <p className="text-sm text-muted-foreground">Electric</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Everything You Need to Track Your Tesla Adventures
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-background shadow-card hover:shadow-elevated transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-sunset flex items-center justify-center mb-4">
                <Map className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Interactive Maps</h3>
              <p className="text-muted-foreground">
                Visualize your routes with beautiful, interactive Mapbox maps. 
                See every turn, every charging stop, every adventure.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background shadow-card hover:shadow-elevated transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-forest flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Deep Analytics</h3>
              <p className="text-muted-foreground">
                Track efficiency, energy usage, and costs. Understand how weather 
                and elevation affect your range.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background shadow-card hover:shadow-elevated transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Charging Insights</h3>
              <p className="text-muted-foreground">
                Log every charging session. Track costs, compare Supercharger 
                rates, and optimize your charging strategy.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background shadow-card hover:shadow-elevated transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">State Tracking</h3>
              <p className="text-muted-foreground">
                Track which states you've visited. GPS-verified locations 
                with clear marking of logically-inferred vs. confirmed states.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background shadow-card hover:shadow-elevated transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4">
                <Battery className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Tessie Integration</h3>
              <p className="text-muted-foreground">
                Connect to Tessie for real-time vehicle data. Sync your drives 
                and charges automatically.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background shadow-card hover:shadow-elevated transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-sunset/20 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-sunset" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Travel Journal</h3>
              <p className="text-muted-foreground">
                Document your adventures with notes, photos, and memories. 
                Create a beautiful record of your journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join fellow Tesla owners in documenting the journey of a lifetime. 
            Whether it's 48 states or your daily commute, every mile tells a story.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8"
            onClick={() => navigate('/auth')}
          >
            Create Free Account
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold">A Whittle Wandering</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Track your Tesla adventures across America
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
