import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlagshipGating } from '@/hooks/useFlagshipGating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Compass, Map, Sparkles } from 'lucide-react';

interface FlagshipGateProps {
  children: ReactNode;
  featureName?: string;
}

export default function FlagshipGate({ children, featureName = 'this feature' }: FlagshipGateProps) {
  const { hasViewedFlagship, isLoading } = useFlagshipGating();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasViewedFlagship) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full card-tesla border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl text-gradient-primary">
              Unlock Consumer Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground">
              Before you can access {featureName}, explore the flagship <span className="font-semibold text-primary">AWW Journey</span> — 
              a 48-state Tesla road trip across America.
            </p>
            
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-sunset/20 flex items-center justify-center mb-2">
                  <Map className="w-5 h-5 text-sunset" />
                </div>
                <p className="text-xs text-muted-foreground">48 States</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-forest/20 flex items-center justify-center mb-2">
                  <Compass className="w-5 h-5 text-forest" />
                </div>
                <p className="text-xs text-muted-foreground">15,847 Miles</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">89 Days</p>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/explore')}
              className="w-full bg-gradient-primary hover:opacity-90"
              size="lg"
            >
              <Compass className="w-5 h-5 mr-2" />
              Explore the AWW Journey
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Complete the journey exploration to unlock personal tracking, journey creation, and analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
