import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, Compass, RefreshCw } from 'lucide-react';
import { useUnifiedJourneyData } from '@/hooks/useUnifiedJourneyData';

const AdventureHero: React.FC = () => {
  const { overview, currentStatus, loading, error, lastUpdate } = useUnifiedJourneyData();

  if (loading && !overview) {
    return (
      <Card className="hero-card relative overflow-hidden animate-pulse">
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="h-12 bg-white/20 rounded w-2/3"></div>
            <div className="h-6 bg-white/20 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="hero-card relative overflow-hidden border-destructive/20">
        <CardContent className="p-8">
          <p className="text-destructive">Error loading journey data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!overview || !currentStatus) {
    return (
      <Card className="hero-card relative overflow-hidden">
        <CardContent className="p-8">
          <p className="text-white/70">No journey data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hero-card relative overflow-hidden">
      <CardContent className="p-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs font-medium px-3 py-1 bg-white/10 border-white/20 text-white">
                <Compass className="w-3 h-3 mr-1" />
                EPIC ROAD TRIP ADVENTURE
              </Badge>
              <h1 className="story-title text-4xl lg:text-6xl font-bold leading-tight">
                A Whittle Wandering
              </h1>
              <p className="text-lg lg:text-xl text-white/80 font-light max-w-2xl">
                {overview.statesVisited} states, {overview.daysElapsed} days, one epic Tesla adventure across America. 
                From Texas to Connecticut - the journey of a lifetime.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[hsl(var(--adventure-orange))]" />
                <span className="font-medium">Currently in {currentStatus.location.state}</span>
              </div>
              <div className="w-1 h-1 bg-white/50 rounded-full" />
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[hsl(var(--adventure-gold))]" />
                <span>Day {overview.daysElapsed} - {overview.progressPercentage.toFixed(1)}% complete</span>
              </div>
              <div className="w-1 h-1 bg-white/50 rounded-full" />
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[hsl(var(--adventure-teal))]" />
                <span className="text-xs">Last update: {lastUpdate?.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 lg:gap-6">
            <div className="text-center p-4 lg:p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="adventure-stat text-3xl lg:text-4xl text-white mb-1">
                {overview.statesVisited}
              </div>
              <div className="text-sm text-white/70 font-medium">States Conquered</div>
              <div className="text-xs text-white/50">of 48 continental</div>
            </div>
            <div className="text-center p-4 lg:p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="adventure-stat text-3xl lg:text-4xl text-[hsl(var(--adventure-gold))] mb-1">
                {overview.progressPercentage.toFixed(0)}%
              </div>
              <div className="text-sm text-white/70 font-medium">Journey Complete</div>
              <div className="text-xs text-white/50">{overview.statesRemaining} states remaining</div>
            </div>
          </div>
        </div>

        {/* Live Tesla Stats */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--adventure-green))]">{currentStatus.vehicle.batteryLevel}%</div>
              <div className="text-xs text-white/70">Battery</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--adventure-blue))]">{overview.totalMiles.toLocaleString()}</div>
              <div className="text-xs text-white/70">Miles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--adventure-orange))]">{currentStatus.vehicle.outsideTemp}°F</div>
              <div className="text-xs text-white/70">Outside</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--adventure-purple))]">{overview.averageMilesPerDay}</div>
              <div className="text-xs text-white/70">Avg/Day</div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 animate-float">
        <div className="absolute top-10 right-10 w-32 h-32 bg-[hsl(var(--adventure-orange))] rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-[hsl(var(--adventure-purple))] rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </Card>
  );
};

export default AdventureHero;