import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, ExternalLink, Shield, Car } from 'lucide-react';

interface TessieApiSetupProps {
  onApiKeySubmit: (apiKey: string) => void;
  onDemoMode: () => void;
  isLoading?: boolean;
}

const TessieApiSetup = ({ onApiKeySubmit, onDemoMode, isLoading }: TessieApiSetupProps) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-tesla-gray-light bg-gradient-to-br from-card to-tesla-gray">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-tesla-cyan rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-background" />
          </div>
          <CardTitle className="text-2xl font-bold">48-State Road Trip Tracker</CardTitle>
          <CardDescription>
            Track your epic 90-day Tesla journey across America
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="border-tesla-blue/20 bg-tesla-blue/5">
            <Shield className="w-4 h-4" />
            <AlertDescription className="text-sm">
              Your API key is stored locally and never sent to our servers. 
              All requests go directly to TESSIE's API.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">TESSIE API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your TESSIE API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-tesla-cyan hover:from-tesla-blue-dark hover:to-tesla-cyan" 
              disabled={!apiKey.trim() || isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect to TESSIE'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-tesla-gray-light" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full border-tesla-cyan/30 hover:bg-tesla-cyan/10" 
            onClick={onDemoMode}
          >
            <Car className="w-4 h-4 mr-2" />
            Try Demo Mode
          </Button>

          <div className="space-y-3 pt-4 border-t border-tesla-gray-light">
            <p className="text-sm text-muted-foreground text-center">
              Don't have a TESSIE API key?
            </p>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => window.open('https://tessie.com/', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Get TESSIE API Key
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TessieApiSetup;