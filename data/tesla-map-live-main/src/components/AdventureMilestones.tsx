import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Mountain, Camera, Star, Map, Compass, Route, Flag, Play, Award, Calendar, Target, Clock, Zap } from 'lucide-react';
import { journeyAchievements } from '@/data/journeyData';

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Play': return Play;
    case 'Calendar': return Calendar;
    case 'Compass': return Compass;
    case 'Trophy': return Trophy;
    case 'Mountain': return Mountain;
    case 'Award': return Award;
    case 'Camera': return Camera;
    case 'Zap': return Zap;
    case 'Clock': return Clock;
    case 'Target': return Target;
    case 'Route': return Route;
    case 'Map': return Map;
    case 'Flag': return Flag;
    default: return Star;
  }
};

const getRarityStyle = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'bg-[hsl(var(--tesla-gray))] border-[hsl(var(--tesla-gray-light))]';
    case 'rare':
      return 'bg-[hsl(var(--tesla-blue)/0.1)] border-[hsl(var(--tesla-blue)/0.3)]';
    case 'epic':
      return 'bg-[hsl(var(--adventure-orange)/0.1)] border-[hsl(var(--adventure-orange)/0.3)]';
    case 'legendary':
      return 'bg-[hsl(var(--adventure-gold)/0.1)] border-[hsl(var(--adventure-gold)/0.3)]';
    default:
      return 'bg-[hsl(var(--tesla-gray))] border-[hsl(var(--tesla-gray-light))]';
  }
};

const getRarityTextColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'text-muted-foreground';
    case 'rare':
      return 'text-[hsl(var(--tesla-blue))]';
    case 'epic':
      return 'text-[hsl(var(--adventure-orange))]';
    case 'legendary':
      return 'text-[hsl(var(--adventure-gold))]';
    default:
      return 'text-muted-foreground';
  }
};

const AdventureMilestones: React.FC = () => {
  const achievedCount = journeyAchievements.filter(m => m.achieved).length;
  
  return (
    <Card className="story-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient">
          <Trophy className="w-5 h-5" />
          Adventure Achievements
          <Badge variant="outline" className="ml-auto bg-[hsl(var(--adventure-gold)/0.1)] border-[hsl(var(--adventure-gold)/0.3)] text-[hsl(var(--adventure-gold))]">
            {achievedCount}/{journeyAchievements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journeyAchievements.map((milestone) => {
            const IconComponent = getIconComponent(milestone.icon);
            const progressPercentage = Math.min((milestone.progress / milestone.total) * 100, 100);
            const isAchieved = milestone.achieved;
            
            return (
              <div
                key={milestone.id}
                className={`milestone-card p-4 rounded-lg border-2 ${getRarityStyle(milestone.rarity)} ${
                  isAchieved ? 'opacity-100' : 'opacity-75'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    isAchieved 
                      ? 'bg-[hsl(var(--adventure-gold)/0.2)] text-[hsl(var(--adventure-gold))]' 
                      : 'bg-[hsl(var(--tesla-gray))] text-muted-foreground'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold text-sm ${isAchieved ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {milestone.title}
                      </h3>
                      {isAchieved && (
                        <Star className="w-4 h-4 text-[hsl(var(--adventure-gold))] fill-current" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                      {milestone.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={getRarityTextColor(milestone.rarity)}>
                          {milestone.rarity.charAt(0).toUpperCase() + milestone.rarity.slice(1)}
                        </span>
                        <span className="text-muted-foreground">
                          {milestone.progress.toLocaleString()}/{milestone.total.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="w-full bg-[hsl(var(--tesla-gray))] rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isAchieved 
                              ? 'bg-[hsl(var(--adventure-gold))]' 
                              : 'bg-[hsl(var(--tesla-blue))]'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdventureMilestones;