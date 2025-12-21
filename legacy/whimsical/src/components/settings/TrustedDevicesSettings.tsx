import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Smartphone, Monitor, Tablet, Trash2, Loader2, Shield, MapPin, Clock, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TrustedDevice {
  id: string;
  device_fingerprint: string;
  device_name: string | null;
  ip_address: string | null;
  city: string | null;
  country_code: string | null;
  is_trusted: boolean;
  last_used_at: string;
  created_at: string;
}

export function TrustedDevicesSettings() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchDevices = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: false });
      
      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: 'Error loading devices',
        description: 'Unable to load your trusted devices.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [user]);

  const removeDevice = async (deviceId: string) => {
    setRemovingId(deviceId);
    
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .delete()
        .eq('id', deviceId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      setDevices(devices.filter(d => d.id !== deviceId));
      toast({
        title: 'Device removed',
        description: 'The device has been removed from your trusted devices.',
      });
    } catch (error) {
      console.error('Error removing device:', error);
      toast({
        title: 'Error removing device',
        description: 'Unable to remove the device. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setRemovingId(null);
    }
  };

  const removeAllDevices = async () => {
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .delete()
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      setDevices([]);
      toast({
        title: 'All devices removed',
        description: 'All trusted devices have been removed. You\'ll need to verify any device on next login.',
      });
    } catch (error) {
      console.error('Error removing all devices:', error);
      toast({
        title: 'Error',
        description: 'Unable to remove devices. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getDeviceIcon = (deviceName: string | null) => {
    const name = deviceName?.toLowerCase() || '';
    if (name.includes('iphone') || name.includes('android')) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (name.includes('ipad') || name.includes('tablet')) {
      return <Tablet className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const formatLastUsed = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    return d.toLocaleDateString();
  };

  const isCurrentDevice = (fingerprint: string) => {
    // Simple check - in production you'd compare with actual current device fingerprint
    return devices.length > 0 && devices[0].device_fingerprint === fingerprint;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-lg">Trusted Devices</CardTitle>
              <CardDescription>
                Manage devices that have accessed your account
              </CardDescription>
            </div>
          </div>
          {devices.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  Remove All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove all trusted devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out of all devices and require re-verification on next login from any device.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={removeAllDevices} className="bg-destructive text-destructive-foreground">
                    Remove All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No trusted devices found. Devices will appear here after you sign in.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    {getDeviceIcon(device.device_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {device.device_name || 'Unknown Device'}
                      </p>
                      {isCurrentDevice(device.device_fingerprint) && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {device.ip_address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {device.city && device.country_code 
                            ? `${device.city}, ${device.country_code}`
                            : device.ip_address}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastUsed(device.last_used_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={removingId === device.id}
                    >
                      {removingId === device.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove this device?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {isCurrentDevice(device.device_fingerprint) 
                          ? "This is your current device. Removing it will require re-verification on your next login."
                          : "This device will need to be verified again if used to sign in."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => removeDevice(device.id)}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-2">
          Devices are automatically added when you sign in. Remove devices you don't recognize to secure your account.
        </p>
      </CardContent>
    </Card>
  );
}