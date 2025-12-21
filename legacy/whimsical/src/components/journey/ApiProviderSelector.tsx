import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Zap, Globe, Shield, Star, CheckCircle2 } from 'lucide-react';

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

interface ApiProviderSelectorProps {
  vehicleMake: string;
  selectedProvider: ApiProvider | null;
  onSelectProvider: (provider: ApiProvider) => void;
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  tessie: <Zap className="w-6 h-6" />,
  smartcar: <Globe className="w-6 h-6" />,
  tesla_fleet: <Shield className="w-6 h-6" />,
};

const PROVIDER_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  tessie: { label: 'Recommended', variant: 'default' },
  smartcar: { label: 'Universal', variant: 'secondary' },
  tesla_fleet: { label: 'Official', variant: 'outline' },
};

export function ApiProviderSelector({ 
  vehicleMake, 
  selectedProvider, 
  onSelectProvider 
}: ApiProviderSelectorProps) {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProviders() {
      const { data, error } = await supabase
        .from('api_providers')
        .select('*')
        .eq('is_active', true)
        .contains('supported_makes', [vehicleMake]);
      
      if (!error && data) {
        // Sort to show Tessie first for Tesla
        const sorted = data.sort((a, b) => {
          if (a.name === 'tessie') return -1;
          if (b.name === 'tessie') return 1;
          return 0;
        });
        setProviders(sorted as ApiProvider[]);
      }
      setIsLoading(false);
    }
    
    if (vehicleMake) {
      fetchProviders();
    }
  }, [vehicleMake]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No API providers available for {vehicleMake} at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => {
        const isSelected = selectedProvider?.id === provider.id;
        const badge = PROVIDER_BADGES[provider.name];
        
        return (
          <Card
            key={provider.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              isSelected 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            )}
            onClick={() => onSelectProvider(provider)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  {PROVIDER_ICONS[provider.name] || <Zap className="w-6 h-6" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{provider.display_name}</h3>
                    {badge && (
                      <Badge variant={badge.variant} className="text-xs">
                        {provider.name === 'tessie' && <Star className="w-3 h-3 mr-1" />}
                        {badge.label}
                      </Badge>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {provider.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {provider.auth_type === 'api_key' ? 'API Key' : 'OAuth'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
