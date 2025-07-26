import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    isCharging: boolean;
    currentState: string;
    currentLocation?: { lat: number; lng: number };
    dailyAverages: {
      miles: number;
      charges: number;
    };
  };
  insights?: {
    efficiency: {
      milesPerKwh: number;
      totalEnergyUsed: number;
    };
    patterns: {
      averageStopDuration: number;
      preferredChargingTimes: string[];
    };
  };
  currentWeather?: {
    temperature: number;
    weather: Array<{ description: string }>;
  };
  isLoading?: boolean;
  error?: string;
}

const SmartVehicleStats: React.FC<SmartVehicleStatsProps> = ({ 
  batteryLevel = 82,
  range = 267,
  chargingState = 'complete',
  temperature = 78,
  odometer = 70128,
  speed = 0,
  lastUpdate = 'Now',
  journeyStats = {
    totalJourneyMiles: 11950,
    statesConquered: 29,
    completionPercentage: 60.4,
    daysElapsed: 56,
    isCharging: chargingState === 'charging',
    currentState: 'Connecticut',
    currentLocation: { lat: 41.1865, lng: -73.1532 },
    dailyAverages: { miles: 213, charges: 1.2 }
  },
  insights = {
    efficiency: { milesPerKwh: 3.8, totalEnergyUsed: 3145 },
    patterns: { averageStopDuration: 45, preferredChargingTimes: ['14:00', '20:00'] }
  },
  currentWeather,
  isLoading = false,
  error
}) => {

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
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
      progress: (journeyStats.totalJourneyMiles / 15000) * 100, // Progress toward 15k miles goal
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
      trend: journeyStats.isCharging ? "⚡ Charging" : `${range} miles range`
    },
    {
      title: "Journey Duration",
      value: `${journeyStats.daysElapsed}`,
      subtitle: "days of adventure",
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      progress: (journeyStats.daysElapsed / 90) * 100, // Progress toward 3 months
      trend: `Day ${journeyStats.daysElapsed} of epic journey`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Live
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </h3>
                  <div className="text-2xl font-bold">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.subtitle}
                  </p>
                  
                  <div className="space-y-2">
                    <Progress 
                      value={Math.min(stat.progress, 100)} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {stat.trend}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Efficiency Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gauge className="w-4 h-4 text-green-500" />
              Efficiency Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Miles/kWh</span>
              <span className="font-semibold">
                {insights.efficiency.milesPerKwh.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Energy</span>
              <span className="font-semibold">
                {insights.efficiency.totalEnergyUsed.toFixed(0)} kWh
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Daily Miles</span>
              <span className="font-semibold">
                {journeyStats.dailyAverages.miles}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Odometer</span>
              <span className="font-semibold font-mono">
                {odometer.toLocaleString()} mi
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Location Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-blue-500" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-lg font-semibold">
                {journeyStats.currentState}
              </div>
              {journeyStats.currentLocation && (
                <div className="text-xs text-muted-foreground font-mono">
                  {journeyStats.currentLocation.lat.toFixed(4)}, {journeyStats.currentLocation.lng.toFixed(4)}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span>{Math.round(temperature)}°F</span>
                {speed > 0 && (
                  <span className="text-muted-foreground">
                    • {speed} mph
                  </span>
                )}
              </div>
              {currentWeather && (
                <div className="text-sm text-muted-foreground">
                  {currentWeather.weather[0]?.description}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Last update: {lastUpdate}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patterns Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Journey Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Stop Time</span>
              <span className="font-semibold">
                {insights.patterns.averageStopDuration}min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Daily Charges</span>
              <span className="font-semibold">
                {journeyStats.dailyAverages.charges.toFixed(1)}
              </span>
            </div>
            {insights.patterns.preferredChargingTimes.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Preferred Charging</span>
                <div className="flex flex-wrap gap-1">
                  {insights.patterns.preferredChargingTimes.slice(0, 3).map((time, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Range Available</span>
              <span className="font-semibold text-green-600">
                {range} miles
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartVehicleStats;
