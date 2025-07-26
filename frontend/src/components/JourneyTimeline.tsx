import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Camera, Star, Mountain, Sunset } from 'lucide-react';
import { journeyTimeline, type TimelineEvent } from '@/data/journeyData';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'milestone': return Star;
    case 'scenic': return Mountain;
    case 'adventure': return Camera;
    case 'cultural': return Sunset;
    default: return MapPin;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'milestone': return 'text-[hsl(var(--adventure-gold))]';
    case 'scenic': return 'text-[hsl(var(--adventure-green))]';
    case 'adventure': return 'text-[hsl(var(--adventure-orange))]';
    case 'cultural': return 'text-[hsl(var(--adventure-purple))]';
    default: return 'text-primary';
  }
};

const JourneyTimeline: React.FC = () => {
  return (
    <Card className="story-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient">
          <Calendar className="w-5 h-5" />
          Journey Chronicles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-[hsl(var(--tesla-blue))] via-[hsl(var(--adventure-orange))] to-[hsl(var(--tesla-gray))]" />
          
          <div className="space-y-6">
            {journeyTimeline.slice(0, 10).map((event, index) => {
              const IconComponent = getTypeIcon(event.type);
              const iconColor = getTypeColor(event.type);
              
              return (
                <div key={event.state} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${
                    event.current ? 'bg-[hsl(var(--adventure-orange))] animate-pulse' : 'bg-[hsl(var(--tesla-gray-light))]'
                  } border-2 border-background`}>
                    <IconComponent className={`w-5 h-5 ${event.current ? 'text-white' : iconColor}`} />
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{event.state}</h3>
                      {event.current && (
                        <Badge className="bg-[hsl(var(--adventure-orange))] text-white text-xs">
                          Current Location
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{event.date}</p>
                    
                    <div className="space-y-2">
                      {event.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[hsl(var(--adventure-gold))] rounded-full" />
                          <span className="text-sm text-foreground/80">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JourneyTimeline;