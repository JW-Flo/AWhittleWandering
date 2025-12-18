import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  MapPin,
  AlertTriangle,
  Database,
  Shield,
  Eye,
  EyeOff,
  Globe,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Maximum journeys per user to control Cloudflare D1 costs
const MAX_JOURNEYS_PER_USER = 5;

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
  
  // Journey limit state
  const [journeyCount, setJourneyCount] = useState<number>(0);
  const [limitChecked, setLimitChecked] = useState(false);
  const [isProvisioningStorage, setIsProvisioningStorage] = useState(false);

  // Form state
  const [journeyData, setJourneyData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    startLocation: '',
    endLocation: '',
    isOpenEnded: true,
    isPublic: false,
    locationPrivacy: 'city' as 'exact' | 'city' | 'region' | 'state',
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

  // Check journey count on mount
  useEffect(() => {
    const checkJourneyLimit = async () => {
      if (!user) return;
      
      const { count, error } = await supabase
        .from('journeys')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (!error && count !== null) {
        setJourneyCount(count);
      }
      setLimitChecked(true);
    };
    
    checkJourneyLimit();
  }, [user]);

  const hasReachedLimit = journeyCount >= MAX_JOURNEYS_PER_USER;

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

  const provisionD1Storage = async (journeyId: string, journeyName: string): Promise<boolean> => {
    setIsProvisioningStorage(true);
    try {
      const { data, error } = await supabase.functions.invoke('journey-storage', {
        body: {
          action: 'provision',
          journey_id: journeyId,
          journey_name: journeyName,
        },
      });

      if (error) {
        console.error('D1 provisioning error:', error);
        return false;
      }

      if (data?.success) {
        console.log('D1 database provisioned:', data.database_id);
        return true;
      }

      return false;
    } catch (err) {
      console.error('D1 provisioning failed:', err);
      return false;
    } finally {
      setIsProvisioningStorage(false);
    }
  };


  const handleSubmit = async () => {
    if (!user) return;
    
    // Double-check journey limit
    if (hasReachedLimit) {
      toast({
        title: 'Journey Limit Reached',
        description: `You can only have ${MAX_JOURNEYS_PER_USER} active journeys. Please archive or delete an existing journey.`,
        variant: 'destructive',
      });
      return;
    }
    
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

      // 3. Create journey (initially without D1 - will update after provisioning)
      const { data: journeyResult, error: journeyError } = await supabase
        .from('journeys')
        .insert({
          user_id: user.id,
          name: journeyData.name,
          description: journeyData.description || null,
          start_date: journeyData.startDate,
          end_date: journeyData.isOpenEnded ? null : journeyData.endDate || null,
          vehicle_id: vehicleResult.id,
          data_storage_type: 'cloudflare_d1', // Using D1 for compartmentalized storage
          is_public: journeyData.isPublic,
        })
        .select('id')
        .single();

      if (journeyError) throw journeyError;

      // 4. Provision D1 database for this journey
      const d1Success = await provisionD1Storage(journeyResult.id, journeyData.name);
      
      if (!d1Success) {
        // D1 failed but journey created - warn user but continue
        toast({
          title: 'Journey Created (Partial)',
          description: `"${journeyData.name}" created but cloud storage setup failed. Data will sync when storage is available.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Journey Created!',
          description: `"${journeyData.name}" is ready with dedicated cloud storage.`,
        });
      }

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
            {/* Journey name field - kept simple for manual entry */}
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

            {/* Privacy Settings */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Journey Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control who can see your journey data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Public/Private Toggle */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {journeyData.isPublic ? (
                        <Globe className="w-4 h-4 text-primary" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Label className="font-medium">
                        {journeyData.isPublic ? 'Public Journey' : 'Private Journey'}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {journeyData.isPublic 
                        ? 'Anyone can view your journey route, stats, and updates'
                        : 'Only you can see your journey data'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={journeyData.isPublic}
                    onCheckedChange={(checked) => setJourneyData(prev => ({ ...prev, isPublic: checked }))}
                  />
                </div>

                {/* Public Journey Disclosure */}
                {journeyData.isPublic && (
                  <div className="space-y-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-600 dark:text-amber-400 mb-2">Public Journey Data Disclosure</p>
                        <p className="text-muted-foreground mb-3">When your journey is public, the following data becomes visible to anyone:</p>
                        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                          <li>Your journey route and waypoints (with 24-hour delay)</li>
                          <li>Vehicle battery levels and charging sessions</li>
                          <li>States visited and travel statistics</li>
                          <li>Journal entries and uploaded photos</li>
                          <li>Your display name (not email)</li>
                        </ul>
                      </div>
                    </div>

                    {/* Location Privacy Level */}
                    <div className="space-y-2 pt-2">
                      <Label className="text-sm font-medium">Location Precision for Public View</Label>
                      <Select
                        value={journeyData.locationPrivacy}
                        onValueChange={(value: 'exact' | 'city' | 'region' | 'state') => 
                          setJourneyData(prev => ({ ...prev, locationPrivacy: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="city">
                            <div className="flex items-center gap-2">
                              <span>City Level (~1km)</span>
                              <span className="text-xs text-muted-foreground">(Recommended)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="region">
                            <span>Region (~50km blur)</span>
                          </SelectItem>
                          <SelectItem value="state">
                            <span>State Only (Most Private)</span>
                          </SelectItem>
                          <SelectItem value="exact">
                            <div className="flex items-center gap-2">
                              <span>Exact Location</span>
                              <span className="text-xs text-destructive">(Not recommended)</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        This controls how precisely your location appears to public viewers.
                      </p>
                    </div>
                  </div>
                )}

                {/* Privacy tip for private journeys */}
                {!journeyData.isPublic && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                      <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      You can make your journey public later from your dashboard settings.
                    </p>
                  </div>
                )}
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
                    <span className="text-muted-foreground">Visibility:</span>
                    <p className="font-medium flex items-center gap-1">
                      {journeyData.isPublic ? (
                        <><Globe className="w-3 h-3" /> Public</>
                      ) : (
                        <><Lock className="w-3 h-3" /> Private</>
                      )}
                    </p>
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

        {/* Journey Limit Warning */}
        {limitChecked && hasReachedLimit && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Journey Limit Reached</AlertTitle>
            <AlertDescription>
              You have {journeyCount} of {MAX_JOURNEYS_PER_USER} journeys. 
              Please archive or delete an existing journey before creating a new one.
            </AlertDescription>
          </Alert>
        )}

        {/* Journey Count Info */}
        {limitChecked && !hasReachedLimit && journeyCount > 0 && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Database className="h-4 w-4" />
            <AlertTitle>Journey Slots</AlertTitle>
            <AlertDescription>
              You're using {journeyCount} of {MAX_JOURNEYS_PER_USER} available journey slots.
            </AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card className={cn(hasReachedLimit && "opacity-50 pointer-events-none")}>
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
              disabled={!canProceed() || hasReachedLimit}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || isProvisioningStorage || hasReachedLimit}
            >
              {isLoading || isProvisioningStorage ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  {isProvisioningStorage ? 'Setting up storage...' : 'Creating...'}
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
