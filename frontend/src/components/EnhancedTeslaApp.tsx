import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnhancedMapFeatures from './EnhancedMapFeatures';
import AdvancedAnalyticsDashboard from './AdvancedAnalyticsDashboard';
import AIJourneyAssistant from './AIJourneyAssistant';
import UXEnhancements from './UXEnhancements';
import {
  Coordinate,
  RouteOptimization,
  SmartChargingRecommendation,
  JourneyInsights,
  MaintenanceAlert,
  SocialShareData,
  NotificationPreferences,
  TripPlan
} from '@/types/enhanced-features';
import {
  Map,
  BarChart3,
  Bot,
  Sparkles,
  Zap,
  TrendingUp,
  MessageSquare,
  Share2,
  CheckCircle
} from 'lucide-react';

interface EnhancedTeslaAppProps {
  currentLocation?: Coordinate;
  destination?: Coordinate;
}

export const EnhancedTeslaApp: React.FC<EnhancedTeslaAppProps> = ({
  currentLocation,
  destination
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimization | null>(null);
  const [_chargingRecommendations, _setChargingRecommendations] = useState<SmartChargingRecommendation[]>([]);
  const [journeyInsights, setJourneyInsights] = useState<JourneyInsights | null>(null);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);

  // Integration handlers
  const handleRouteOptimized = (optimization: RouteOptimization) => {
    setRouteOptimization(optimization);
    console.warn('🎯 Route optimization completed:', optimization);
  };

  const handleChargingRecommendation = (recommendation: SmartChargingRecommendation) => {
    setChargingRecommendations(prev => [...prev, recommendation]);
    console.warn('⚡ New charging recommendation:', recommendation);
  };

  const handleInsightGenerated = (insight: JourneyInsights) => {
    setJourneyInsights(insight);
    console.warn('📊 Journey insights generated:', insight);
  };

  const handleMaintenanceAlert = (alert: MaintenanceAlert) => {
    setMaintenanceAlerts(prev => [...prev, alert]);
    console.warn('🔧 Maintenance alert:', alert);
  };

  const handleTripPlanned = (plan: TripPlan) => {
    console.warn('🗺️ Trip planned:', plan);
    // Integrate with map features
  };

  const handleShareTrip = (shareData: SocialShareData) => {
    console.warn('🔗 Trip shared:', shareData);
    // Integrate with social features
  };

  const handleNotificationToggle = (preferences: NotificationPreferences) => {
    setNotifications(preferences);
    console.warn('🔔 Notification preferences updated:', preferences);
  };

  // Cross-track integration status
  const getIntegrationStatus = () => {
    const mapFeatures = routeOptimization ? 1 : 0;
    const analyticsData = journeyInsights ? 1 : 0;
    const aiAssistant = maintenanceAlerts.length > 0 ? 1 : 0;
    const uxFeatures = notifications ? 1 : 0;
    
    const totalFeatures = mapFeatures + analyticsData + aiAssistant + uxFeatures;
    return {
      active: totalFeatures,
      total: 4,
      percentage: (totalFeatures / 4) * 100
    };
  };

  const status = getIntegrationStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Integration Status */}
      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enhanced Journey Command Center</h1>
              <p className="text-gray-600 mt-1">
                Complete AI-powered journey management and automation
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Integration Status</p>
                <div className="flex items-center gap-2">
                  <Badge variant={status.percentage === 100 ? 'default' : 'secondary'}>
                    {status.active}/{status.total} Active
                  </Badge>
                  {status.percentage === 100 && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="maps" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Enhanced Maps
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="ux" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              UX Features
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Multi-Track Development Success!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <Map className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                      <h3 className="font-semibold">Enhanced Maps</h3>
                      <p className="text-sm text-gray-600 mt-1">Real-time route optimization</p>
                      <Badge className="mt-2" variant={routeOptimization ? 'default' : 'secondary'}>
                        {routeOptimization ? 'Active' : 'Ready'}
                      </Badge>
                    </div>

                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-3" />
                      <h3 className="font-semibold">Advanced Analytics</h3>
                      <p className="text-sm text-gray-600 mt-1">Journey insights & efficiency</p>
                      <Badge className="mt-2" variant={journeyInsights ? 'default' : 'secondary'}>
                        {journeyInsights ? 'Active' : 'Ready'}
                      </Badge>
                    </div>

                    <div className="text-center p-6 bg-purple-50 rounded-lg">
                      <Bot className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                      <h3 className="font-semibold">AI Assistant</h3>
                      <p className="text-sm text-gray-600 mt-1">Natural language planning</p>
                      <Badge className="mt-2" variant={maintenanceAlerts.length > 0 ? 'default' : 'secondary'}>
                        {maintenanceAlerts.length > 0 ? 'Active' : 'Ready'}
                      </Badge>
                    </div>

                    <div className="text-center p-6 bg-orange-50 rounded-lg">
                      <Share2 className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                      <h3 className="font-semibold">UX Features</h3>
                      <p className="text-sm text-gray-600 mt-1">Real-time & social features</p>
                      <Badge className="mt-2" variant={notifications ? 'default' : 'secondary'}>
                        {notifications ? 'Active' : 'Ready'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded">
                        <Zap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Route Optimization</p>
                        <p className="font-bold">
                          {routeOptimization ? `${routeOptimization.energySavings.toFixed(1)}% Energy Saved` : 'Ready to Optimize'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Journey Insights</p>
                        <p className="font-bold">
                          {journeyInsights ? `${journeyInsights.averageEfficiency.toFixed(2)} mi/kWh` : 'Analyzing Data'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">AI Assistant</p>
                        <p className="font-bold">
                          {maintenanceAlerts.length > 0 ? `${maintenanceAlerts.length} Alerts` : 'Standing By'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Enhanced Maps Tab */}
          <TabsContent value="maps">
            <EnhancedMapFeatures
              currentLocation={currentLocation}
              destination={destination}
              onRouteOptimized={handleRouteOptimized}
              onChargingRecommendation={handleChargingRecommendation}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdvancedAnalyticsDashboard
              timeRange="30d"
              onInsightGenerated={handleInsightGenerated}
            />
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="assistant">
            <AIJourneyAssistant
              onTripPlanned={handleTripPlanned}
              onMaintenanceAlert={handleMaintenanceAlert}
            />
          </TabsContent>

          {/* UX Features Tab */}
          <TabsContent value="ux">
            <UXEnhancements
              onNotificationToggle={handleNotificationToggle}
              onShareTrip={handleShareTrip}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedTeslaApp;
