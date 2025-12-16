import { Link } from 'react-router-dom';
import { Logo, LogoMark } from '@/components/Logo';
import { 
  Navigation, 
  Mail, 
  MapPin, 
  Heart,
  ExternalLink,
  TreePine
} from 'lucide-react';

interface FooterProps {
  variant?: 'full' | 'minimal';
}

export function Footer({ variant = 'full' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer className="border-t border-border/50 py-6 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoMark className="w-8 h-8" />
              <span className="font-display font-bold text-foreground">AWW</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/sms-terms" className="hover:text-foreground transition-colors">SMS Terms</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {currentYear} A Whittle Wandering
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border/50 bg-card/50">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-muted-foreground max-w-md leading-relaxed">
              Track your adventures across the world. Born from a 48-state Tesla road trip, 
              AWW helps you document and share your journey with rich analytics and beautiful storytelling.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TreePine className="w-4 h-4 text-moss" />
              <span>Made with </span>
              <Heart className="w-4 h-4 text-sunset fill-sunset" />
              <span> on the open road</span>
            </div>
          </div>

          {/* Journey Column */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-foreground">Journey</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/explore" 
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Explore AWW Journey
                </Link>
              </li>
              <li>
                <Link 
                  to="/leaderboard" 
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Leaderboard
                </Link>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/awhittlewandering" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Follow on Instagram
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-foreground">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/privacy" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/sms-terms" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  SMS Terms & Consent
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:hello@awhittlewandering.com" 
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/50 bg-forest-floor/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} A Whittle Wandering. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              June 3 – August 31, 2025 • 48 States • 100% Electric
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
