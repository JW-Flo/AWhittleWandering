import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRobustData } from '../hooks/useRobustData';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Zap, 
  Route, 
  Clock, 
  TrendingUp, 
  Battery, 
  Gauge,
  Target,
  Calendar,
  Award
} from 'lucide-react';

interface SmartVehicleStatsProps {
  batteryLevel?: number;
  range?: number;
  chargingState?: string;
  temperature?: number;
  odometer?: number;
  speed?: number;
  lastUpdate?: string;
  journeyStats?: {
    totalJourneyMiles: number;
    statesConquered: number;
    completionPercentage: number;
    daysElapsed: number;
  };
  currentWeather?: any;
  isLoading?: boolean;
  error?: string;
}

const SmartVehicleStats: React.FC<SmartVehicleStatsProps> = ({
  batteryLevel: propBatteryLevel = 82,
  range: propRange = 267,
  chargingState: propChargingState = 'complete',
  temperature: propTemperature = 78,
  odometer: propOdometer = 70128,
  speed: propSpeed = 0,
  lastUpdate: propLastUpdate = 'Now',
  currentWeather,
  isLoading: propLoading = false,
  error: propError
}) => {
  // Use robust data from the simplified hook
  const { 
    currentLocation, 
    journeyInsights, 
    drives, 
    charges, 
    loading: dataLoading, 
    error: dataError 
  } = useRobustData();

  // Use real data when available, fallback to props
  const isLoading = propLoading || dataLoading;
  const error = propError || dataError;

  // Extract actual values from current location or use props
  const batteryLevel = currentLocation?.battery_level || propBatteryLevel;
  const range = currentLocation?.range || propRange;
  const chargingState = currentLocation?.charging_state || propChargingState;
  const speed = currentLocation?.speed || propSpeed;
  const odometer = currentLocation?.odometer || propOdometer;
  const temperature = currentLocation?.temperature || propTemperature;
  const lastUpdate = currentLocation?.timestamp ? new Date(currentLocation.timestamp).toLocaleString() : propLastUpdate;

  // Calculate journey stats from insights
  const journeyStats = journeyInsights ? {
    totalJourneyMiles: Math.round(journeyInsights.totalMiles || 0),
    statesConquered: journeyInsights.statesVisited?.length || 0,
    completionPercentage: ((journeyInsights.statesVisited?.length || 0) / 50) * 100,
    daysElapsed: journeyInsights.daysElapsed || 0,
    averageSpeed: 65,
    currentState: journeyInsights.statesVisited?.[journeyInsights.statesVisited.length - 1] || 'California',
    dailyAverages: { 
      miles: Math.round((journeyInsights.totalMiles || 0) / (journeyInsights.daysElapsed || 1)), 
      charges: 1.2 
    },
    isCharging: chargingState === 'charging'
  } : {
    totalJourneyMiles: 634,
    statesConquered: 2,
    completionPercentage: 4.0,
    daysElapsed: 7,
    averageSpeed: 65,
    currentState: 'California',
    isCharging: chargingState === 'charging',
    dailyAverages: { miles: 90, charges: 0.5 }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded mb-4"></div>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center">
          <div className="text-destructive mb-2">⚠️ Data Error</div>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Journey Miles",
      value: journeyStats.totalJourneyMiles.toLocaleString(),
      subtitle: "since June 1st",
      icon: Route,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      progress: (journeyStats.totalJourneyMiles / 15000) * 100,
      trend: `+${journeyStats.dailyAverages.miles}/day avg`
    },
    {
      title: "States Conquered",
      value: journeyStats.statesConquered,
      subtitle: `${journeyStats.completionPercentage.toFixed(1)}% complete`,
      icon: Award,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      progress: journeyStats.completionPercentage,
      trend: `${48 - journeyStats.statesConquered} remaining`
    },
    {
      title: "Current Battery",
      value: `${batteryLevel}%`,
      subtitle: journeyStats.isCharging ? "Charging" : "Ready",
      icon: journeyStats.isCharging ? Zap : Battery,
      color: batteryLevel > 50 ? "text-green-500" : "text-orange-500",
      bgColor: batteryLevel > 50 ? "bg-green-500/10" : "bg-orange-500/10",
      progress: batteryLevel,
      trend: journeyStats.isCharging ? "Charging" : `${range} miles range`
    },
    {
      title: "Current Speed",
      value: `${speed}`,
      subtitle: "miles per hour",
      icon: Gauge,
      color: speed > 0 ? "text-blue-500" : "text-gray-500",
      bgColor: speed > 0 ? "bg-blue-500/10" : "bg-gray-500/10",
      progress: (speed / 80) * 100,
      trend: speed > 0 ? "In Motion" : "Parked"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-sm text-muted-foreground">{card.subtitle}</p>
                  </div>
                  
                  {card.progress !== undefined && (
                    <div className="space-y-1">
                      <Progress 
                        value={Math.min(card.progress, 100)} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">{card.trend}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">State:</span>
              <span className="font-medium">{journeyStats.currentState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Temperature:</span>
              <span className="font-medium">{temperature}°F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last Update:</span>
              <span className="font-medium text-xs">{lastUpdate}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-green-500" />
              Vehicle Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Odometer:</span>
              <span className="font-medium">{odometer.toLocaleString()} mi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Charging:</span>
              <Badge variant={chargingState === 'charging' ? 'default' : 'secondary'}>
                {chargingState}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Range Available:</span>
              <span className="font-medium">
                {range} miles
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              Journey Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Days Elapsed:</span>
              <span className="font-medium">{journeyStats.daysElapsed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Drives:</span>
              <span className="font-medium">{drives?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Charges:</span>
              <span className="font-medium">{charges?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartVehicleStats;
