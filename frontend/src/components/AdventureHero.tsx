import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Compass } from 'lucide-react';

interface AdventureHeroProps {
  currentLocation: string;
  daysElapsed: number;
  statesVisited: number;
  totalStates: number;
}

const AdventureHero: React.FC<AdventureHeroProps> = ({
  currentLocation,
  daysElapsed,
  statesVisited,
  totalStates
}) => {
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
                48 continental states, one epic Tesla adventure across America. 
                From Texas to Connecticut - the journey continues!
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[hsl(var(--adventure-orange))]" />
                <span className="font-medium">Currently in {currentLocation}</span>
              </div>
              <div className="w-1 h-1 bg-white/50 rounded-full" />
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[hsl(var(--adventure-gold))]" />
                <span>Day {daysElapsed} • Ongoing Adventure</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 lg:gap-6">
            <div className="text-center p-4 lg:p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="adventure-stat text-3xl lg:text-4xl text-white mb-1">
                {statesVisited}
              </div>
              <div className="text-sm text-white/70 font-medium">States Conquered</div>
            </div>
            <div className="text-center p-4 lg:p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="adventure-stat text-3xl lg:text-4xl text-[hsl(var(--adventure-gold))] mb-1">
                {((statesVisited / totalStates) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-white/70 font-medium">States Complete</div>
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