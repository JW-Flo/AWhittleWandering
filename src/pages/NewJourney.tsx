import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Car, MapPin, Loader2 } from 'lucide-react';

export default function NewJourney() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Pre-filled defaults for "A Whittle Wandering"
  const [journeyData, setJourneyData] = useState({
    name: 'A Whittle Wandering - 48 State Adventure',
    description: 'An epic 48-state Tesla road trip across America, documenting every mile, charge, and adventure along the way.',
    startDate: '2025-06-03',
    endDate: '2025-08-31',
  });

  const [vehicleData, setVehicleData] = useState({
    nickname: 'Shadowfax',
    model: 'Model Y',
    year: 2020,
    vin: '5YJYGDEE5LF027324',
    color: 'White',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Please log in first', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      // Create vehicle first
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          user_id: user.id,
          nickname: vehicleData.nickname,
          model: vehicleData.model,
          year: vehicleData.year,
          vin: vehicleData.vin,
          color: vehicleData.color,
        })
        .select()
        .single();

      if (vehicleError) throw vehicleError;

      // Create journey linked to vehicle
      const { data: journey, error: journeyError } = await supabase
        .from('journeys')
        .insert({
          user_id: user.id,
          vehicle_id: vehicle.id,
          name: journeyData.name,
          description: journeyData.description,
          start_date: journeyData.startDate,
          end_date: journeyData.endDate,
        })
        .select()
        .single();

      if (journeyError) throw journeyError;

      toast({
        title: 'Journey Created!',
        description: `${journeyData.name} is ready. Head to the Data tab to import your GPS data.`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating journey:', error);
      toast({
        title: 'Error creating journey',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Journey</h1>
            <p className="text-muted-foreground mt-2">
              Set up your journey and vehicle to start tracking your adventure.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Journey Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Journey Details
                </CardTitle>
                <CardDescription>
                  Pre-filled with "A Whittle Wandering" defaults
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Journey Name</Label>
                  <Input
                    id="name"
                    value={journeyData.name}
                    onChange={(e) => setJourneyData({ ...journeyData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={journeyData.description}
                    onChange={(e) => setJourneyData({ ...journeyData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={journeyData.startDate}
                      onChange={(e) => setJourneyData({ ...journeyData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={journeyData.endDate}
                      onChange={(e) => setJourneyData({ ...journeyData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Details
                </CardTitle>
                <CardDescription>
                  Your Tesla information for Tessie API integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      value={vehicleData.nickname}
                      onChange={(e) => setVehicleData({ ...vehicleData, nickname: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={vehicleData.model}
                      onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={vehicleData.year}
                      onChange={(e) => setVehicleData({ ...vehicleData, year: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={vehicleData.color}
                      onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vin">VIN (for Tessie API)</Label>
                  <Input
                    id="vin"
                    value={vehicleData.vin}
                    onChange={(e) => setVehicleData({ ...vehicleData, vin: e.target.value })}
                    placeholder="17-character VIN"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for real-time vehicle status via Tessie API
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Journey...
                </>
              ) : (
                'Create Journey & Vehicle'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
