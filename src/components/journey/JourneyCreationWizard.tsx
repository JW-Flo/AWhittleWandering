import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VehicleMakeSelector, VehicleModelSelector } from './VehicleMakeSelector';
import { ApiProviderSelector } from './ApiProviderSelector';
import { ApiSetupGuide } from './ApiSetupGuide';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  ArrowRight, 
  Car, 
  Route, 
  Zap, 
  CheckCircle2,
  MapPin
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

const STEPS = [
  { id: 'journey', title: 'Journey Details', icon: Route },
  { id: 'vehicle', title: 'Your Vehicle', icon: Car },
  { id: 'connect', title: 'Connect API', icon: Zap },
  { id: 'confirm', title: 'Start Tracking', icon: CheckCircle2 },
];

export function JourneyCreationWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiValid, setApiValid] = useState(false);

  // Form state
  const [journeyData, setJourneyData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    startLocation: '',
    endLocation: '',
    isOpenEnded: true,
  });

  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    nickname: '',
    vin: '',
    year: new Date().getFullYear(),
  });

  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | null>(null);
  const [apiToken, setApiToken] = useState('');
  const [vehicleStatus, setVehicleStatus] = useState<any>(null);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return journeyData.name.trim().length > 0;
      case 1:
        return vehicleData.make && vehicleData.model && vehicleData.nickname.trim().length > 0;
      case 2:
        return apiValid;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleTokenSubmit = async (token: string) => {
    if (!selectedProvider) return;
    
    setIsLoading(true);
    setApiError(null);
    setApiToken(token);

    try {
      // Test the API connection
      const { data, error } = await supabase.functions.invoke('vehicle-api', {
        body: {
          action: 'test_connection',
          provider: selectedProvider.name,
          token: token,
          vin: vehicleData.vin || undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        setApiValid(true);
        setVehicleStatus(data.vehicle);
        
        // Auto-fill VIN if we got it from the API
        if (data.vehicle?.vin && !vehicleData.vin) {
          setVehicleData(prev => ({ ...prev, vin: data.vehicle.vin }));
        }

        toast({
          title: 'Connected!',
          description: `Successfully connected to your ${vehicleData.make}.`,
        });
      } else {
        setApiError(data.error || 'Failed to connect. Please check your token.');
      }
    } catch (err: any) {
      setApiError(err.message || 'Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // 1. Save API credentials
      let credentialId: string | null = null;
      if (selectedProvider && apiToken) {
        const { data: credData, error: credError } = await supabase
          .from('user_api_credentials')
          .upsert({
            user_id: user.id,
            provider_id: selectedProvider.id,
            encrypted_token: apiToken, // In production, encrypt this
            is_valid: true,
            last_verified_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,provider_id',
          })
          .select('id')
          .single();

        if (credError) throw credError;
        credentialId = credData.id;
      }

      // 2. Create vehicle
      const { data: vehicleResult, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          user_id: user.id,
          nickname: vehicleData.nickname,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          vin: vehicleData.vin || null,
          api_provider_id: selectedProvider?.id || null,
          api_credential_id: credentialId,
        })
        .select('id')
        .single();

      if (vehicleError) throw vehicleError;

      // 3. Create journey
      const { data: journeyResult, error: journeyError } = await supabase
        .from('journeys')
        .insert({
          user_id: user.id,
          name: journeyData.name,
          description: journeyData.description || null,
          start_date: journeyData.startDate,
          end_date: journeyData.isOpenEnded ? null : journeyData.endDate || null,
          vehicle_id: vehicleResult.id,
        })
        .select('id')
        .single();

      if (journeyError) throw journeyError;

      toast({
        title: 'Journey Created!',
        description: `"${journeyData.name}" is ready to track.`,
      });

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error creating journey:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create journey.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="journey-name">Journey Name *</Label>
              <Input
                id="journey-name"
                placeholder="My Epic Road Trip"
                value={journeyData.name}
                onChange={(e) => setJourneyData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A brief description of your adventure..."
                value={journeyData.description}
                onChange={(e) => setJourneyData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={journeyData.startDate}
                  onChange={(e) => setJourneyData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              {!journeyData.isOpenEnded && (
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={journeyData.endDate}
                    onChange={(e) => setJourneyData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="open-ended"
                checked={journeyData.isOpenEnded}
                onChange={(e) => setJourneyData(prev => ({ ...prev, isOpenEnded: e.target.checked }))}
                className="rounded border-border"
              />
              <Label htmlFor="open-ended" className="text-sm text-muted-foreground cursor-pointer">
                Open-ended journey (no set end date)
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Starting Point (optional)
                </Label>
                <Input
                  id="start-location"
                  placeholder="e.g., San Francisco, CA"
                  value={journeyData.startLocation}
                  onChange={(e) => setJourneyData(prev => ({ ...prev, startLocation: e.target.value }))}
                />
              </div>

              {!journeyData.isOpenEnded && (
                <div className="space-y-2">
                  <Label htmlFor="end-location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Destination (optional)
                  </Label>
                  <Input
                    id="end-location"
                    placeholder="e.g., New York, NY"
                    value={journeyData.endLocation}
                    onChange={(e) => setJourneyData(prev => ({ ...prev, endLocation: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Vehicle Make *</Label>
              <VehicleMakeSelector
                selectedMake={vehicleData.make}
                onSelectMake={(make) => setVehicleData(prev => ({ ...prev, make, model: '' }))}
              />
            </div>

            {vehicleData.make && (
              <div className="space-y-3">
                <Label>Model *</Label>
                <VehicleModelSelector
                  make={vehicleData.make}
                  selectedModel={vehicleData.model}
                  onSelectModel={(model) => setVehicleData(prev => ({ ...prev, model }))}
                />
              </div>
            )}

            {vehicleData.model && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname *</Label>
                  <Input
                    id="nickname"
                    placeholder="e.g., Shadowfax, Sparky"
                    value={vehicleData.nickname}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, nickname: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min={2010}
                    max={new Date().getFullYear() + 1}
                    value={vehicleData.year}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="vin">VIN (optional)</Label>
                  <Input
                    id="vin"
                    placeholder="Vehicle Identification Number"
                    value={vehicleData.vin}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, vin: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Adding your VIN helps ensure accurate data matching
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Choose Your Data Provider</Label>
              <p className="text-sm text-muted-foreground">
                Select how you want to connect your {vehicleData.make} to track your journey automatically.
              </p>
              <ApiProviderSelector
                vehicleMake={vehicleData.make}
                selectedProvider={selectedProvider}
                onSelectProvider={setSelectedProvider}
              />
            </div>

            {selectedProvider && (
              <ApiSetupGuide
                provider={selectedProvider}
                onTokenSubmit={handleTokenSubmit}
                isLoading={isLoading}
                error={apiError}
                isValid={apiValid}
              />
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Ready to Start!</h3>
                    <p className="text-muted-foreground">
                      Your journey is configured and ready to track.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Journey Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Journey:</span>
                    <p className="font-medium">{journeyData.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>
                    <p className="font-medium">{new Date(journeyData.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vehicle:</span>
                    <p className="font-medium">{vehicleData.year} {vehicleData.make} {vehicleData.model}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nickname:</span>
                    <p className="font-medium">"{vehicleData.nickname}"</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data Provider:</span>
                    <p className="font-medium">{selectedProvider?.display_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium text-green-500">Connected</p>
                  </div>
                </div>

                {vehicleStatus && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Current Vehicle Status</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {vehicleStatus.battery_level && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">{vehicleStatus.battery_level}%</p>
                          <p className="text-xs text-muted-foreground">Battery</p>
                        </div>
                      )}
                      {vehicleStatus.range && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">{Math.round(vehicleStatus.range)}</p>
                          <p className="text-xs text-muted-foreground">Miles Range</p>
                        </div>
                      )}
                      {vehicleStatus.odometer && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">{vehicleStatus.odometer.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Odometer</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Create Your Journey</h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              
              return (
                <div 
                  key={step.id}
                  className={cn(
                    'flex items-center gap-2 text-sm',
                    isActive && 'text-primary font-medium',
                    isComplete && 'text-green-500',
                    !isActive && !isComplete && 'text-muted-foreground'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    isActive && 'bg-primary text-primary-foreground',
                    isComplete && 'bg-green-500 text-white',
                    !isActive && !isComplete && 'bg-muted'
                  )}>
                    {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="hidden md:inline">{step.title}</span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <CardDescription>
              {currentStep === 0 && 'Tell us about your upcoming adventure'}
              {currentStep === 1 && 'Select your vehicle make and model'}
              {currentStep === 2 && 'Connect your vehicle\'s data API for automatic tracking'}
              {currentStep === 3 && 'Review and start your journey'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  Start Journey
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
