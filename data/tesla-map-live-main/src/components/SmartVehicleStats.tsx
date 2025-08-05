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
import { useSmartJourney } from '@/hooks/useSmartJourney';

interface SmartVehicleStatsProps {
  tessieApiKey?: string;
}

const SmartVehicleStats: React.FC<SmartVehicleStatsProps> = ({ tessieApiKey }) => {
  const {
    journeyStats,
    insights,
    currentWeather,
    isLoading,
    error
  } = useSmartJourney(tessieApiKey);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="story-card animate-pulse">
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
      <Card className="story-card border-destructive">
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
      color: "text-[hsl(var(--adventure-orange))]",
      bgColor: "bg-[hsl(var(--adventure-orange)/0.1)]",
      progress: (journeyStats.totalJourneyMiles / 10000) * 100, // Progress toward 10k miles
      trend: `+${journeyStats.dailyAverages.miles}/day avg`
    },
    {
      title: "States Conquered",
      value: journeyStats.statesConquered,
      subtitle: `${journeyStats.completionPercentage}% complete`,
      icon: Award,
      color: "text-[hsl(var(--adventure-gold))]",
      bgColor: "bg-[hsl(var(--adventure-gold)/0.1)]",
      progress: journeyStats.completionPercentage,
      trend: `${48 - journeyStats.statesConquered} remaining`
    },
    {
      title: "Current Battery",
      value: `${journeyStats.batteryLevel}%`,
      subtitle: journeyStats.isCharging ? "Charging" : "Ready",
      icon: journeyStats.isCharging ? Zap : Battery,
      color: journeyStats.batteryLevel > 50 ? "text-[hsl(var(--adventure-green))]" : "text-[hsl(var(--adventure-orange))]",
      bgColor: journeyStats.batteryLevel > 50 ? "bg-[hsl(var(--adventure-green)/0.1)]" : "bg-[hsl(var(--adventure-orange)/0.1)]",
      progress: journeyStats.batteryLevel,
      trend: journeyStats.isCharging ? "⚡ Charging" : "🔋 Available"
    },
    {
      title: "Journey Duration",
      value: `${journeyStats.daysElapsed}`,
      subtitle: "days of adventure",
      icon: Calendar,
      color: "text-[hsl(var(--tesla-blue))]",
      bgColor: "bg-[hsl(var(--tesla-blue)/0.1)]",
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
            <Card key={index} className="story-card hover:shadow-lg transition-all duration-300 group">
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
        <Card className="story-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gauge className="w-4 h-4 text-[hsl(var(--adventure-green))]" />
              Efficiency Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Miles/kWh</span>
              <span className="font-semibold">
                {insights?.efficiency.milesPerKwh.toFixed(1) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Energy</span>
              <span className="font-semibold">
                {insights?.efficiency.totalEnergyUsed.toFixed(0) || 'N/A'} kWh
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Daily Miles</span>
              <span className="font-semibold">
                {journeyStats.dailyAverages.miles}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Location Card */}
        <Card className="story-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[hsl(var(--tesla-blue))]" />
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
              {currentWeather && (
                <div className="flex items-center gap-2 text-sm">
                  <span>{Math.round(currentWeather.temperature)}°F</span>
                  <span className="text-muted-foreground">
                    {currentWeather.weather[0]?.description}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Patterns Card */}
        <Card className="story-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--adventure-purple))]" />
              Journey Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Stop Time</span>
              <span className="font-semibold">
                {insights?.patterns.averageStopDuration || 0}min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Daily Charges</span>
              <span className="font-semibold">
                {journeyStats.dailyAverages.charges.toFixed(1)}
              </span>
            </div>
            {insights?.patterns.preferredChargingTimes.length > 0 && (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartVehicleStats;