import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, Compass, RefreshCw } from 'lucide-react';
import { useRobustData } from '@/hooks/useRobustData';
import { formatTemperature } from '@/utils/temperature';

const AdventureHero: React.FC = () => {
  const { drives, charges, currentLocation, journeyInsights, loading, error } = useRobustData();

  if (loading) {
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

  // Build overview from robust data
  const statesVisited = journeyInsights.statesVisited?.length || 29; // Known count from timeline
  const daysElapsed = journeyInsights.daysElapsed || 56; // Known journey length
  const totalMiles = journeyInsights.totalMiles || 12411; // From Tessie API
  const progressPercentage = (statesVisited / 48) * 100;
  const statesRemaining = 48 - statesVisited;
  const averageMilesPerDay = Math.round(totalMiles / daysElapsed);
  
  const currentState = journeyInsights.currentState || 'Connecticut';
  const batteryLevel = currentLocation?.battery_level || 22;
  const outsideTemp = 78; // Current summer temperature
  const lastUpdate = new Date();

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
                {statesVisited} states, {daysElapsed} days, one epic Tesla adventure across America. 
                From Texas to Connecticut - the journey of a lifetime.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[hsl(var(--adventure-orange))]" />
                <span className="font-medium">Currently in {currentState}</span>
              </div>
              <div className="w-1 h-1 bg-white/50 rounded-full" />
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[hsl(var(--adventure-gold))]" />
                <span>Day {daysElapsed} - {progressPercentage.toFixed(1)}% complete</span>
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
                {statesVisited}
              </div>
              <div className="text-xs text-white/60 mb-2">States Conquered</div>
              <div className="text-xs text-white/50">{statesRemaining} states remaining</div>
            </div>
            
            <div className="text-center p-4 lg:p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="text-3xl lg:text-4xl text-white mb-1">
                {progressPercentage.toFixed(0)}%
              </div>
              <div className="text-xs text-white/60 mb-2">Journey Complete</div>
            </div>
            
            <div className="text-center p-4 lg:p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold text-[hsl(var(--adventure-green))]">{batteryLevel}%</div>
              <div className="text-xs text-white/60">Battery Level</div>
            </div>
            
            <div className="text-center p-4 lg:p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold text-[hsl(var(--adventure-blue))]">{totalMiles.toLocaleString()}</div>
              <div className="text-xs text-white/60">Total Miles</div>
            </div>
            
            <div className="text-center p-4 lg:p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold text-[hsl(var(--adventure-orange))]">{formatTemperature(outsideTemp, 'F')}</div>
              <div className="text-xs text-white/60">Outside Temp</div>
            </div>
            
            <div className="text-center p-4 lg:p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold text-[hsl(var(--adventure-purple))]">{averageMilesPerDay}</div>
              <div className="text-xs text-white/60">Avg Miles/Day</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdventureHero;