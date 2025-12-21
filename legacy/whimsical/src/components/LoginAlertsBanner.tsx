import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, Monitor, MapPin, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface LoginAlert {
  id: string;
  alert_type: string;
  ip_address: string;
  device_fingerprint: string;
  details: {
    userAgent?: string;
    deviceName?: string;
    previousIp?: string;
    newIp?: string;
    firstSeen?: string;
  };
  created_at: string;
}

export function LoginAlertsBanner() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<LoginAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    
    fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;
    
    try {
      const response = await supabase.functions.invoke('auth-security', {
        body: {
          action: 'get_alerts',
          userId: user.id
        }
      });

      if (response.data?.alerts) {
        setAlerts(response.data.alerts);
      }
    } catch (error) {
      console.error('Failed to fetch login alerts:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    if (!user) return;
    
    try {
      await supabase.functions.invoke('auth-security', {
        body: {
          action: 'acknowledge_alert',
          alertId,
          userId: user.id
        }
      });

      setDismissedAlerts(prev => new Set([...prev, alertId]));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visibleAlerts.map(alert => (
        <Alert 
          key={alert.id} 
          variant="default"
          className="border-amber-500/50 bg-amber-500/10"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {alert.alert_type === 'new_device' ? (
                <Monitor className="h-5 w-5 text-amber-500 mt-0.5" />
              ) : alert.alert_type === 'new_location' ? (
                <MapPin className="h-5 w-5 text-amber-500 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              )}
              <div>
                <AlertTitle className="text-amber-500 font-semibold">
                  {alert.alert_type === 'new_device' && 'New Device Login Detected'}
                  {alert.alert_type === 'new_location' && 'Login from New Location'}
                  {alert.alert_type === 'multiple_failures' && 'Multiple Failed Login Attempts'}
                </AlertTitle>
                <AlertDescription className="text-muted-foreground mt-1">
                  {alert.alert_type === 'new_device' && (
                    <>
                      A login was detected from a new device.
                      {alert.details?.deviceName && ` Device: ${alert.details.deviceName}`}
                    </>
                  )}
                  {alert.alert_type === 'new_location' && (
                    <>
                      Your account was accessed from a different IP address.
                      {alert.details?.previousIp && alert.details?.newIp && 
                        ` (Changed from ${alert.details.previousIp.substring(0, 8)}... to ${alert.details.newIp.substring(0, 8)}...)`
                      }
                    </>
                  )}
                  <span className="block text-xs mt-1">
                    {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </AlertDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => acknowledgeAlert(alert.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3 ml-8">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => acknowledgeAlert(alert.id)}
            >
              This was me
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => {
                acknowledgeAlert(alert.id);
                window.location.href = '/settings';
              }}
            >
              Secure my account
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}