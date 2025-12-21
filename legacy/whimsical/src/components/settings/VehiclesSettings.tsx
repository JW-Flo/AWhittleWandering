import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Car, Plus, Trash2, Edit2, Loader2, Zap, CheckCircle, AlertCircle, Key, RefreshCw, ChevronDown, TestTube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  nickname: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  vin: string | null;
  api_provider_id: string | null;
  api_credential_id: string | null;
}

interface APIProvider {
  id: string;
  name: string;
  display_name: string;
  supported_makes: string[];
}

export default function VehiclesSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [providers, setProviders] = useState<APIProvider[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingApi, setTestingApi] = useState<string | null>(null);
  const [apiTestResults, setApiTestResults] = useState<Record<string, { success: boolean; scopes: string[]; error?: string }>>({});
  
  const [formData, setFormData] = useState({
    nickname: '',
    make: '',
    model: '',
    year: '',
    color: '',
    vin: '',
    api_provider_id: ''
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [vehiclesRes, providersRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('api_providers').select('*').eq('is_active', true)
      ]);

      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (providersRes.data) setProviders(providersRes.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const payload = {
        user_id: user.id,
        nickname: formData.nickname,
        make: formData.make || null,
        model: formData.model || null,
        year: formData.year ? parseInt(formData.year) : null,
        color: formData.color || null,
        vin: formData.vin || null,
        api_provider_id: formData.api_provider_id || null
      };

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(payload)
          .eq('id', editingVehicle.id);
        if (error) throw error;
        toast.success('Vehicle updated');
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert(payload);
        if (error) throw error;
        toast.success('Vehicle added');
      }

      setShowAddDialog(false);
      setEditingVehicle(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error('Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      toast.success('Vehicle deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    }
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      nickname: vehicle.nickname,
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year?.toString() || '',
      color: vehicle.color || '',
      vin: vehicle.vin || '',
      api_provider_id: vehicle.api_provider_id || ''
    });
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nickname: '',
      make: '',
      model: '',
      year: '',
      color: '',
      vin: '',
      api_provider_id: ''
    });
  };

  const testApiConnection = async (vehicle: Vehicle) => {
    if (!vehicle.api_provider_id) {
      toast.error('API provider required to test connection');
      return;
    }

    setTestingApi(vehicle.id);
    
    try {
      // Get the provider name
      const provider = providers.find(p => p.id === vehicle.api_provider_id);
      if (!provider) {
        throw new Error('API provider not found');
      }

      // Get the API credential token
      let token = '';
      if (vehicle.api_credential_id) {
        const { data: credData } = await supabase
          .from('user_api_credentials')
          .select('encrypted_token')
          .eq('id', vehicle.api_credential_id)
          .single();
        
        if (credData?.encrypted_token) {
          token = credData.encrypted_token;
        }
      }

      if (!token) {
        throw new Error('No API token configured. Please add your API credentials first.');
      }

      const { data, error } = await supabase.functions.invoke('vehicle-api', {
        body: { 
          action: 'test_connection',
          provider: provider.name,
          token: token,
          vin: vehicle.vin || undefined
        }
      });

      if (error) throw error;
      
      if (data?.success === false) {
        throw new Error(data.error || 'Connection test failed');
      }

      const scopes = [];
      
      // Check available data from the response
      if (data?.vehicle) {
        if (data.vehicle.battery_level !== undefined) scopes.push('Vehicle State');
        if (data.vehicle.latitude !== undefined) scopes.push('Location');
        if (data.vehicle.battery_level !== undefined) scopes.push('Battery');
        if (data.vehicle.odometer !== undefined) scopes.push('Drive History');
        if (data.vehicle.charging_state !== undefined) scopes.push('Charge History');
      }
      
      setApiTestResults(prev => ({
        ...prev,
        [vehicle.id]: {
          success: true,
          scopes: scopes.length > 0 ? scopes : ['Vehicle State', 'Location', 'Battery'],
          error: undefined
        }
      }));

      toast.success(`API connected successfully!`);
    } catch (error: any) {
      console.error('API test error:', error);
      setApiTestResults(prev => ({
        ...prev,
        [vehicle.id]: {
          success: false,
          scopes: [],
          error: error.message || 'Connection failed'
        }
      }));
      toast.error(error.message || 'API connection test failed');
    } finally {
      setTestingApi(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-tesla">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5 text-primary" />
          Your Vehicles
        </CardTitle>
        <CardDescription>
          Manage your vehicles and their API connections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle List */}
        {vehicles.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No vehicles added yet</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                resetForm();
                setEditingVehicle(null);
                setShowAddDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Vehicle
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => {
              const provider = providers.find(p => p.id === vehicle.api_provider_id);
              const testResult = apiTestResults[vehicle.id];
              
              return (
                <Collapsible key={vehicle.id}>
                  <div className="bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Car className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{vehicle.nickname}</h4>
                            {vehicle.api_credential_id && (
                              <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                                <Zap className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'No details'}
                          </p>
                          {vehicle.vin && (
                            <p className="text-xs text-muted-foreground/70 font-mono mt-0.5">
                              VIN: {vehicle.vin.slice(-6)}
                            </p>
                          )}
                          {provider && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {provider.display_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CollapsibleTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-10 w-10">
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(vehicle);
                          }}
                          className="h-10 w-10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(vehicle.id);
                          }}
                          className="h-10 w-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t border-border space-y-4">
                        {/* API Test Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">API Connection Test</Label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testApiConnection(vehicle)}
                              disabled={testingApi === vehicle.id || !vehicle.api_provider_id}
                            >
                              {testingApi === vehicle.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <TestTube className="w-4 h-4 mr-2" />
                              )}
                              Test Connection
                            </Button>
                          </div>
                          
                          {testResult && (
                            <div className={`p-3 rounded-lg ${testResult.success ? 'bg-success/10 border border-success/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                {testResult.success ? (
                                  <CheckCircle className="w-4 h-4 text-success" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-destructive" />
                                )}
                                <span className="font-medium text-sm">
                                  {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                                </span>
                              </div>
                              
                              {testResult.success && testResult.scopes.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Available data scopes:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {testResult.scopes.map(scope => (
                                      <Badge key={scope} variant="secondary" className="text-xs">
                                        {scope}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {testResult.error && (
                                <p className="text-xs text-destructive">{testResult.error}</p>
                              )}
                            </div>
                          )}
                          
                          {!vehicle.api_provider_id && (
                            <p className="text-xs text-muted-foreground">
                              Select an API provider and add credentials to test the connection
                            </p>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}

        {/* Add Vehicle Button */}
        {vehicles.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              resetForm();
              setEditingVehicle(null);
              setShowAddDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Vehicle
          </Button>
        )}

        {/* Vehicle Quota */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {vehicles.length} of 5 vehicle slots used
          </p>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
              <DialogDescription>
                {editingVehicle ? 'Update your vehicle details' : 'Add a new vehicle to track'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname *</Label>
                <Input
                  id="nickname"
                  placeholder="e.g., Shadowfax"
                  value={formData.nickname}
                  onChange={(e) => setFormData(f => ({ ...f, nickname: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Select
                    value={formData.make}
                    onValueChange={(value) => setFormData(f => ({ ...f, make: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tesla">Tesla</SelectItem>
                      <SelectItem value="Rivian">Rivian</SelectItem>
                      <SelectItem value="Ford">Ford</SelectItem>
                      <SelectItem value="GM">GM</SelectItem>
                      <SelectItem value="BMW">BMW</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Model Y"
                    value={formData.model}
                    onChange={(e) => setFormData(f => ({ ...f, model: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="e.g., 2024"
                    value={formData.year}
                    onChange={(e) => setFormData(f => ({ ...f, year: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="e.g., Midnight Silver"
                    value={formData.color}
                    onChange={(e) => setFormData(f => ({ ...f, color: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">VIN (Optional)</Label>
                <Input
                  id="vin"
                  placeholder="Vehicle Identification Number"
                  value={formData.vin}
                  onChange={(e) => setFormData(f => ({ ...f, vin: e.target.value }))}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Required for live data sync via Tessie or other APIs
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_provider">Data Provider</Label>
                <Select
                  value={formData.api_provider_id}
                  onValueChange={(value) => setFormData(f => ({ ...f, api_provider_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.nickname}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingVehicle ? 'Update' : 'Add'} Vehicle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
