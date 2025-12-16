import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/layout/Footer';
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Eye,
  Database,
  MapPin,
  Image,
  Mail,
  Smartphone,
  Cookie,
  UserCheck,
  Server,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-forest/5 via-background to-background" />
        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-forest/10 border border-forest/20 mb-6">
            <Shield className="w-10 h-10 text-forest" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Privacy <span className="text-gradient-primary">Policy</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your privacy matters. Here's exactly how we handle your data on A Whittle Wandering.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: December 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Quick Overview */}
          <section className="bg-card/50 rounded-2xl border border-border p-6 md:p-8">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
              <Eye className="w-6 h-6 text-primary" />
              Quick Overview
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-forest/5 border border-forest/10">
                <Lock className="w-5 h-5 text-forest mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Your Data is Yours</p>
                  <p className="text-sm text-muted-foreground">We never sell your personal information to third parties.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Location Control</p>
                  <p className="text-sm text-muted-foreground">You choose how precise your location sharing is.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-sunset/5 border border-sunset/10">
                <UserCheck className="w-5 h-5 text-sunset mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Transparent Practices</p>
                  <p className="text-sm text-muted-foreground">We tell you exactly what we collect and why.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-moss/5 border border-moss/10">
                <Trash2 className="w-5 h-5 text-moss mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Easy Deletion</p>
                  <p className="text-sm text-muted-foreground">Request complete account deletion anytime.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Information We Collect */}
          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
              <Database className="w-6 h-6 text-primary" />
              Information We Collect
            </h2>
            
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-forest" />
                  Account Information
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-forest">•</span>
                    <span>Email address (for account creation and notifications)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">•</span>
                    <span>Display name (how you appear to other users)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">•</span>
                    <span>Profile picture (optional)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest">•</span>
                    <span>Phone number (only if you opt into SMS notifications)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Journey & Vehicle Data
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>GPS coordinates from your vehicle API (Tessie, Tesla Fleet, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Battery level, charging sessions, and energy consumption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Vehicle information (make, model, nickname)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Journey names, descriptions, and dates</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5 text-sunset" />
                  Media & Content
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-sunset">•</span>
                    <span>Photos you upload to your journeys</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sunset">•</span>
                    <span>Journal entries and notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sunset">•</span>
                    <span>Photo metadata (location, date, if you choose to include)</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
              <Server className="w-6 h-6 text-forest" />
              How We Use Your Data
            </h2>
            
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Core Platform Features</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Display your journey route on interactive maps</li>
                  <li>• Calculate trip statistics (miles traveled, energy consumed, etc.)</li>
                  <li>• Show your photos at the locations where they were taken</li>
                  <li>• Generate leaderboard rankings and achievements</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Communications</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Send notification updates you've opted into (email, SMS, push)</li>
                  <li>• Respond to your support inquiries</li>
                  <li>• Share important platform updates</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Platform Improvement</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Analyze aggregate usage patterns to improve features</li>
                  <li>• Debug technical issues</li>
                  <li>• Develop new features based on user needs</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Location Privacy */}
          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
              <MapPin className="w-6 h-6 text-primary" />
              Location Privacy Controls
            </h2>
            
            <div className="bg-card rounded-xl border border-border p-6">
              <p className="text-muted-foreground mb-4">
                We give you granular control over how your location data is shared with others:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-semibold text-foreground mb-1">Exact</p>
                  <p className="text-sm text-muted-foreground">Full precision GPS coordinates</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-semibold text-foreground mb-1">City</p>
                  <p className="text-sm text-muted-foreground">Rounded to city level (~5 mile radius)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-semibold text-foreground mb-1">Region</p>
                  <p className="text-sm text-muted-foreground">General area only (~25 mile radius)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-semibold text-foreground mb-1">State</p>
                  <p className="text-sm text-muted-foreground">Only state name shown</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-sunset" />
              Data Sharing & Third Parties
            </h2>
            
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <p className="text-muted-foreground">
                <strong className="text-foreground">We do not sell your data.</strong> We share information only in these limited circumstances:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-foreground min-w-[120px]">Service Providers</span>
                  <span>We use trusted services to operate the platform (Supabase for database, Mapbox for maps, Twilio for SMS, Resend for email).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-foreground min-w-[120px]">Vehicle APIs</span>
                  <span>Your API credentials connect directly to your vehicle provider (Tessie, Tesla Fleet, etc.).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-foreground min-w-[120px]">Legal Requirements</span>
                  <span>We may disclose data if required by law or to protect our rights.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-foreground min-w-[120px]">With Your Consent</span>
                  <span>Public journeys and shared content are visible according to your privacy settings.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Cookies */}
          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
              <Cookie className="w-6 h-6 text-sand" />
              Cookies & Local Storage
            </h2>
            
            <div className="bg-card rounded-xl border border-border p-6">
              <p className="text-muted-foreground mb-4">
                We use minimal cookies and local storage for essential functionality:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong className="text-foreground">Authentication:</strong> Keep you logged in securely</li>
                <li>• <strong className="text-foreground">Preferences:</strong> Remember your settings and display preferences</li>
                <li>• <strong className="text-foreground">Performance:</strong> Cache data for faster loading</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We do not use third-party advertising or tracking cookies.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-moss" />
              Your Rights
            </h2>
            
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-moss">✓</span>
                  <span><strong className="text-foreground">Access</strong> all data we have about you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-moss">✓</span>
                  <span><strong className="text-foreground">Correct</strong> any inaccurate information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-moss">✓</span>
                  <span><strong className="text-foreground">Delete</strong> your account and all associated data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-moss">✓</span>
                  <span><strong className="text-foreground">Export</strong> your journey data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-moss">✓</span>
                  <span><strong className="text-foreground">Opt out</strong> of any notifications at any time</span>
                </li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, contact us at{' '}
                <a href="mailto:privacy@awhittlewandering.com" className="text-primary hover:underline">
                  privacy@awhittlewandering.com
                </a>
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-milestone rounded-2xl border border-primary/20 p-6 md:p-8 text-center">
            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold mb-4">Questions?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              If you have any questions about this Privacy Policy or how we handle your data, please reach out.
            </p>
            <a href="mailto:privacy@awhittlewandering.com">
              <Button className="gap-2">
                <Mail className="w-4 h-4" />
                Contact Privacy Team
              </Button>
            </a>
          </section>

        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
