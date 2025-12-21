import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle, 
  Zap, 
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiProvider {
  id: string;
  name: string;
  display_name: string;
  description: string;
  setup_url: string;
  auth_type: string;
  supported_makes: string[];
  is_active: boolean;
}

interface ApiSetupGuideProps {
  provider: ApiProvider;
  onTokenSubmit: (token: string) => void;
  isLoading?: boolean;
  error?: string | null;
  isValid?: boolean;
}

// Detailed step-by-step guides for each provider
const PROVIDER_GUIDES: Record<string, {
  steps: { title: string; description: string; image?: string }[];
  tips: string[];
  features: string[];
  estimatedTime: string;
}> = {
  tessie: {
    estimatedTime: '2 minutes',
    steps: [
      {
        title: '1. Go to Tessie Settings',
        description: 'Open my.tessie.com and log in with your Tesla account. Navigate to Settings in the top-right menu.',
      },
      {
        title: '2. Find API Section',
        description: 'Scroll down to find the "API" section in your settings page.',
      },
      {
        title: '3. Generate Access Token',
        description: 'Click "Generate new token" button. Give it a memorable name like "AWW Tracker".',
      },
      {
        title: '4. Copy Your Token',
        description: 'Copy the generated token immediately - it will only be shown once! Paste it below.',
      },
    ],
    tips: [
      'Keep your token private - never share it publicly',
      'You can revoke the token anytime from Tessie settings',
      'Tessie tokens don\'t expire unless you revoke them',
    ],
    features: [
      'Real-time location tracking',
      'Battery & charging status',
      'Full drive history',
      'Vehicle commands',
      'Climate control',
    ],
  },
  smartcar: {
    estimatedTime: '5 minutes',
    steps: [
      {
        title: '1. Create Smartcar Account',
        description: 'Go to dashboard.smartcar.com and create a free developer account if you don\'t have one.',
      },
      {
        title: '2. Create an Application',
        description: 'Click "Create Application" and give it a name. Select the permissions you need (location, battery, odometer).',
      },
      {
        title: '3. Get Your Credentials',
        description: 'In your application settings, find your Client ID and Client Secret under "Credentials".',
      },
      {
        title: '4. Connect Your Vehicle',
        description: 'Click the "Connect" button below to authorize your vehicle through Smartcar\'s secure OAuth flow.',
      },
    ],
    tips: [
      'Smartcar uses OAuth - you\'ll log in directly with your vehicle manufacturer',
      'You can disconnect your vehicle at any time',
      'Works with 30+ EV brands',
    ],
    features: [
      'Location tracking',
      'Battery level',
      'Odometer reading',
      'Charging status',
      'Tire pressure (some vehicles)',
    ],
  },
  tesla_fleet: {
    estimatedTime: '15 minutes',
    steps: [
      {
        title: '1. Apply for Developer Access',
        description: 'Go to developer.tesla.com and apply for Fleet API access. This requires a business use case.',
      },
      {
        title: '2. Register Your Application',
        description: 'Once approved, register your application and configure the OAuth settings.',
      },
      {
        title: '3. Generate Keys',
        description: 'Generate your client credentials and public key for secure communication.',
      },
      {
        title: '4. Complete OAuth Flow',
        description: 'Use the OAuth flow to connect your Tesla account to your application.',
      },
    ],
    tips: [
      'Tesla Fleet API is intended for business/commercial use',
      'Approval process may take several days',
      'Requires more technical setup than Tessie',
    ],
    features: [
      'Official Tesla API',
      'Full vehicle access',
      'Fleet management',
      'Enterprise features',
    ],
  },
};

export function ApiSetupGuide({ 
  provider, 
  onTokenSubmit, 
  isLoading, 
  error,
  isValid 
}: ApiSetupGuideProps) {
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const guide = PROVIDER_GUIDES[provider.name];

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(provider.setup_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onTokenSubmit(token.trim());
    }
  };

  if (!guide) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Setup guide not available for this provider.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{provider.display_name}</CardTitle>
                <CardDescription>{provider.description}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {guide.estimatedTime}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {guide.features.map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="steps">Setup Steps</TabsTrigger>
          <TabsTrigger value="tips">Tips & Info</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="mt-4 space-y-4">
          {guide.steps.map((step, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="flex">
                <div className="w-12 bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{index + 1}</span>
                </div>
                <div className="flex-1 p-4">
                  <h4 className="font-semibold mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </Card>
          ))}

          {/* Direct Link Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(provider.setup_url, '_blank')}
          >
            Open {provider.display_name} Settings
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </TabsContent>

        <TabsContent value="tips" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Security Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {guide.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Token Input Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enter Your API Token</CardTitle>
          <CardDescription>
            Paste your {provider.display_name} token below to connect your vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-token">API Token</Label>
              <div className="relative">
                <Input
                  id="api-token"
                  type="password"
                  placeholder="Paste your token here..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className={cn(
                    'pr-10',
                    error && 'border-destructive',
                    isValid && 'border-green-500'
                  )}
                />
                {isValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={!token.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying Connection...
                </>
              ) : (
                <>
                  Connect Vehicle
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
