import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Shield } from 'lucide-react';
import SecurityNotice from './SecurityNotice';

interface TessieApiSetupProps {
  onApiKeySubmit: (apiKey: string) => void;
  onDemoMode: () => void;
  isLoading?: boolean;
}

const TessieApiSetup = ({ onApiKeySubmit, onDemoMode, isLoading }: TessieApiSetupProps) => {
  // API key input removed - backend handles authentication securely
  const handleContinue = () => {
    // Pass empty string to indicate backend-managed connection
    onApiKeySubmit('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-tesla-gray-light bg-gradient-to-br from-card to-tesla-gray">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-tesla-cyan rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-background" />
          </div>
          <CardTitle className="text-2xl font-bold">A Whittle Wandering</CardTitle>
          <CardDescription>
            Follow our epic cross-country Tesla journey through all 48 states
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="border-tesla-blue/20 bg-tesla-blue/5">
            <Shield className="w-4 h-4" />
            <AlertDescription className="text-sm">
              Tesla data is now securely managed by our backend. 
              API keys are stored server-side and never exposed to your browser.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              The application automatically connects to Tesla data through our secure backend.
              No API key configuration is required.
            </p>
            
            <Button 
              onClick={() => onApiKeySubmit('')} 
              className="w-full bg-gradient-to-r from-primary to-tesla-cyan hover:from-tesla-blue-dark hover:to-tesla-cyan" 
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Continue to Dashboard'}
            </Button>
          </div>
          
          <div className="mt-6">
            <SecurityNotice />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TessieApiSetup;