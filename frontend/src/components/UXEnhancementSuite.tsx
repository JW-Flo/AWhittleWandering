import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Share2, Clock, Smartphone, Zap } from 'lucide-react';
import { UXEnhancement, NotificationSettings } from '@/types/advancedFeatures';

interface UXEnhancementSuiteProps {
  onSettingsChanged: (settings: UXEnhancement) => void;
}

export const UXEnhancementSuite: React.FC<UXEnhancementSuiteProps> = ({
  onSettingsChanged
}) => {
  const [settings, setSettings] = useState<UXEnhancement>({
    realTimeUpdates: true,
    interactiveTimeline: true,
    socialSharing: false,
    notificationPreferences: {
      chargingAlerts: true,
      routeUpdates: true,
      weatherWarnings: true,
      maintenanceReminders: false,
      efficiencyTips: true
    }
  });

  const [isLiveMode, setIsLiveMode] = useState(true);
  const [shareCount, setShareCount] = useState(0);

  useEffect(() => {
    onSettingsChanged(settings);
  }, [settings, onSettingsChanged]);

  const handleSettingChange = (key: keyof UXEnhancement, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value
      }
    }));
  };

  const simulateShare = () => {
    setShareCount(prev => prev + 1);
    // Simulate mistral-powered social optimization
    setTimeout(() => {
      alert('🚀 Journey shared with optimal hashtags and Tesla community insights!');
    }, 500);
  };

  const simulateRealTimeUpdate = () => {
    // Simulate real-time data stream
    return Math.floor(Math.random() * 100);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            ✨ TRACK 4: UX Enhancements (mistral)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Real-time Updates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5" />
                <div>
                  <div className="font-medium">Real-time Updates</div>
                  <div className="text-sm text-gray-600">Live data streaming</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isLiveMode && (
                  <Badge variant="default" className="animate-pulse">
                    Live: {simulateRealTimeUpdate()}%
                  </Badge>
                )}
                <Switch
                  checked={settings.realTimeUpdates}
                  onCheckedChange={(checked) => {
                    handleSettingChange('realTimeUpdates', checked);
                    setIsLiveMode(checked);
                  }}
                />
              </div>
            </div>

            {/* Interactive Timeline */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5" />
                <div>
                  <div className="font-medium">Interactive Timeline</div>
                  <div className="text-sm text-gray-600">Drag & drop journey events</div>
                </div>
              </div>
              <Switch
                checked={settings.interactiveTimeline}
                onCheckedChange={(checked) => handleSettingChange('interactiveTimeline', checked)}
              />
            </div>

            {/* Social Sharing */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5" />
                <div>
                  <div className="font-medium">Social Sharing</div>
                  <div className="text-sm text-gray-600">Tesla community integration</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {shareCount > 0 && (
                  <Badge variant="secondary">{shareCount} shared</Badge>
                )}
                <Switch
                  checked={settings.socialSharing}
                  onCheckedChange={(checked) => handleSettingChange('socialSharing', checked)}
                />
              </div>
            </div>

            {settings.socialSharing && (
              <div className="ml-8 pt-2">
                <Button onClick={simulateShare} size="sm" variant="outline">
                  Share Current Journey
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Smart Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(settings.notificationPreferences).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleNotificationChange(key as keyof NotificationSettings, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">🎯 ALL 4 TRACKS ACTIVE!</div>
            <div className="text-sm text-gray-600 mt-1">
              Human-Dyad coordination running across phi3, gemma3, codellama, and mistral
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
