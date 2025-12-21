import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Route, Trophy, Mountain, Camera, Navigation, Coffee } from 'lucide-react';
import { useRobustData } from '@/hooks/useRobustData';

interface TimelineDataDisplayProps {
  tessieApiKey?: string;
}

const TimelineDataDisplay: React.FC<TimelineDataDisplayProps> = ({ tessieApiKey: _tessieApiKey }) => {
  const { insights, isLoading, error, dataSource } = useRobustData();

  if (isLoading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
          <div className="h-12 bg-slate-800 rounded"></div>
          <div className="h-6 bg-slate-800 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/50 border border-red-900/50 rounded-2xl p-8">
        <div className="text-center">
          <p className="text-red-400 font-mono text-sm mb-4">TIMELINE_ERROR: {error}</p>
          <p className="text-slate-500 font-mono text-xs">Using fallback timeline data</p>
        </div>
      </div>
    );
  }

  const getActivityIcon = (category: string) => {
    switch (category) {
      case 'milestone': return <Mountain className="w-4 h-4 text-green-400" />;
      case 'arrival': return <Navigation className="w-4 h-4 text-blue-400" />;
      case 'departure': return <Route className="w-4 h-4 text-purple-400" />;
      case 'overnight': return <Coffee className="w-4 h-4 text-orange-400" />;
      case 'activity': return <Camera className="w-4 h-4 text-yellow-400" />;
      default: return <MapPin className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeColor = (category?: string) => {
    switch (category) {
      case 'milestone': return 'text-amber-400 bg-amber-400/20';
      case 'arrival': return 'text-emerald-400 bg-emerald-400/20';
      case 'departure': return 'text-orange-400 bg-orange-400/20';
      case 'overnight': return 'text-slate-400 bg-slate-400/20';
      case 'activity': return 'text-teal-400 bg-teal-400/20';
      default: return 'text-teal-400 bg-teal-400/20';
    }
  };

  // Calculate stats from insights
  const statesVisited = insights?.totalStatesVisited || 0;
  const totalMiles = insights ? insights.totalStatesVisited * 400 : 0;
  const daysElapsed = insights?.totalDrivingDays || 0;
  const averageDailyMiles = daysElapsed > 0 ? Math.round(totalMiles / daysElapsed) : 0;
  const progressPercentage = (statesVisited / 48) * 100;

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-br from-slate-900/30 via-emerald-900/30 to-green-900/30 border-emerald-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-bold text-white">
            <Trophy className="w-8 h-8 text-amber-400" />
            Journey Overview
            <Badge className={`text-sm ${dataSource === 'api' ? 'bg-green-400/20 text-green-400' : 'bg-amber-400/20 text-amber-400'}`}>
              {dataSource === 'api' ? 'LIVE TRACKING' : 'ARCHIVED DATA'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30">
              <div className="text-4xl font-bold text-emerald-400 mb-2">{statesVisited}</div>
              <div className="text-emerald-200 font-medium">States Explored</div>
              <Badge className="mt-2 bg-emerald-400/20 text-emerald-400 text-xs">
                {48 - statesVisited} remaining
              </Badge>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-slate-600/20 to-slate-800/20 border border-slate-500/30">
              <div className="text-4xl font-bold text-slate-400 mb-2">{totalMiles.toLocaleString()}</div>
              <div className="text-slate-200 font-medium">Miles Traveled</div>
              <Badge className="mt-2 bg-slate-400/20 text-slate-400 text-xs">
                {averageDailyMiles}/day avg
              </Badge>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30">
              <div className="text-4xl font-bold text-amber-400 mb-2">{daysElapsed}</div>
              <div className="text-amber-200 font-medium">Days on the Trail</div>
              <Badge className="mt-2 bg-amber-400/20 text-amber-400 text-xs">
                since June 1st
              </Badge>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-teal-600/20 to-teal-800/20 border border-teal-500/30">
              <div className="text-4xl font-bold text-teal-400 mb-2">{progressPercentage.toFixed(1)}%</div>
              <div className="text-teal-200 font-medium">Complete</div>
              <Badge className="mt-2 bg-teal-400/20 text-teal-400 text-xs">
                Continental USA
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-900/30 via-slate-900/30 to-amber-900/30 border-emerald-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-bold text-white">
            <Calendar className="w-8 h-8 text-emerald-400" />
            Journey Timeline
            <Badge className="bg-emerald-400/20 text-emerald-400 text-sm">EVERY MOMENT</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-xl text-gray-300 text-center font-light">
              Every milestone, every state, every unforgettable moment of this Tesla road trip! 🚗⚡
            </p>
            
            <div className="grid gap-4 max-h-96 overflow-y-auto pr-4 space-y-3">
              {(insights?.timelineEntries || []).map((entry, index) => {
                const IconComponent = getActivityIcon(entry.category);
                const colorClasses = getTypeColor(entry.category);
                
                return (
                  <div key={index} className="group relative">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-gray-700/50 hover:to-gray-800/50 transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50 backdrop-blur-sm">
                      <div className={`p-2 rounded-full ${colorClasses} flex-shrink-0 mt-1`}>
                        {IconComponent}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className="bg-emerald-500/20 text-emerald-400 px-3 py-1 font-medium">
                            {entry.date}
                          </Badge>
                          <Badge className="bg-gradient-to-r from-slate-500/20 to-teal-500/20 text-slate-300 px-3 py-1 font-medium border border-slate-500/30">
                            {entry.state}
                          </Badge>
                          {entry.category && (
                            <Badge className={`${colorClasses} px-2 py-1 text-xs font-medium border border-current/30`}>
                              {entry.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-200 leading-relaxed font-medium">
                          {entry.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimelineDataDisplay;
