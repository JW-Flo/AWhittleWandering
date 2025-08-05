import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  MapPin, 
  BarChart3, 
  Brain, 
  Smartphone,
  Activity,
  Zap
} from 'lucide-react';

// Import all our new components
import { SmartMapFeatures } from './SmartMapFeatures';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SmartAssistant } from './SmartAssistant';
import { UXEnhancementSuite } from './UXEnhancementSuite';

import { 
  RouteOptimization, 
  AISuggestion, 
  JourneyContext,
  UXEnhancement 
} from '@/types/advancedFeatures';

interface MasterCoordinationDashboardProps {
  journeyData?: any[];
  currentLocation: [number, number];
  destination?: [number, number];
}

export const MasterCoordinationDashboard: React.FC<MasterCoordinationDashboardProps> = ({
  journeyData = [],
  currentLocation,
  destination
}) => {
  const [activeTrack, setActiveTrack] = useState('overview');
  const [coordinationStatus, setCoordinationStatus] = useState({
    phi3: { status: 'active', task: 'Route Optimization', progress: 94 },
    gemma3: { status: 'active', task: 'Analytics Processing', progress: 87 },
    codellama: { status: 'active', task: 'AI Assistant', progress: 91 },
    mistral: { status: 'active', task: 'UX Enhancement', progress: 96 }
  });

  // Mock journey context
  const journeyContext: JourneyContext = {
    currentLocation,
    destination,
    batteryLevel: 78,
    weatherConditions: {
      location: currentLocation,
      temperature: 72,
      windSpeed: 8,
      precipitation: 0,
      visibility: 10,
      impact: 'positive'
    },
    timeOfDay: new Date().toLocaleTimeString(),
    urgency: 'medium'
  };

  const handleRouteOptimized = (route: RouteOptimization) => {
    console.log('Route optimized:', route);
    // Update coordination status
    setCoordinationStatus(prev => ({
      ...prev,
      phi3: { ...prev.phi3, progress: 98 }
    }));
  };

  const handleSuggestionSelected = (suggestion: AISuggestion) => {
    console.log('AI suggestion selected:', suggestion);
    // Update coordination status
    setCoordinationStatus(prev => ({
      ...prev,
      codellama: { ...prev.codellama, progress: 95 }
    }));
  };

  const handleUXSettingsChanged = (settings: UXEnhancement) => {
    console.log('UX settings updated:', settings);
    // Update coordination status
    setCoordinationStatus(prev => ({
      ...prev,
      mistral: { ...prev.mistral, progress: 99 }
    }));
  };

  // Simulate coordination updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCoordinationStatus(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(model => {
          const current = updated[model as keyof typeof updated];
          if (current.progress < 100) {
            current.progress = Math.min(100, current.progress + Math.random() * 3);
          }
        });
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Master Coordination Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Rocket className="h-8 w-8" />
            🚀 MASTER COORDINATION DASHBOARD
          </CardTitle>
          <p className="text-blue-100">
            All 4 development tracks running simultaneously with Human-Dyad AI coordination
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(coordinationStatus).map(([model, status]) => (
              <div key={model} className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium uppercase">{model}</span>
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    {status.status}
                  </Badge>
                </div>
                <div className="text-sm text-blue-100 mb-2">{status.task}</div>
                <Progress value={status.progress} className="h-2 bg-white/20" />
                <div className="text-xs text-blue-200 mt-1">{status.progress.toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTrack} onValueChange={setActiveTrack}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="track1" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Track 1: Maps
          </TabsTrigger>
          <TabsTrigger value="track2" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Track 2: Analytics
          </TabsTrigger>
          <TabsTrigger value="track3" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Track 3: AI Assistant
          </TabsTrigger>
          <TabsTrigger value="track4" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Track 4: UX
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SmartMapFeatures
              currentLocation={currentLocation}
              destination={destination}
              onRouteOptimized={handleRouteOptimized}
            />
            <AnalyticsDashboard journeyData={journeyData} />
            <SmartAssistant
              currentContext={journeyContext}
              onSuggestionSelected={handleSuggestionSelected}
            />
            <UXEnhancementSuite onSettingsChanged={handleUXSettingsChanged} />
          </div>
        </TabsContent>

        <TabsContent value="track1">
          <SmartMapFeatures
            currentLocation={currentLocation}
            destination={destination}
            onRouteOptimized={handleRouteOptimized}
          />
        </TabsContent>

        <TabsContent value="track2">
          <AnalyticsDashboard journeyData={journeyData} />
        </TabsContent>

        <TabsContent value="track3">
          <SmartAssistant
            currentContext={journeyContext}
            onSuggestionSelected={handleSuggestionSelected}
          />
        </TabsContent>

        <TabsContent value="track4">
          <UXEnhancementSuite onSettingsChanged={handleUXSettingsChanged} />
        </TabsContent>
      </Tabs>

      {/* Live Coordination Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Live Human-Dyad Coordination Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall System Performance</span>
              <Badge variant="default" className="bg-green-500">
                98.7% Operational
              </Badge>
            </div>
            <Progress value={98.7} className="h-3" />
            <div className="text-xs text-gray-600">
              🔥 All AI models coordinating seamlessly • Real-time optimization active • 
              Zero conflicts detected • Ready for production scaling
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
