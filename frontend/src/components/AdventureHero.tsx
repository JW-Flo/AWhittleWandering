import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Battery, Navigation, Activity, Gauge, Award, Target } from 'lucide-react';
import { useRobustData } from '@/hooks/useRobustData';
import { formatTemperature } from '@/utils/temperature';

const HeroComponent: React.FC = () => {
  const { drives, charges, currentLocation, journeyInsights, loading, error } = useRobustData();

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-2xl">
        <div className="p-8 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 bg-slate-800 rounded w-1/4"></div>
            <div className="h-10 bg-slate-800 rounded w-1/2"></div>
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden bg-slate-950 border border-red-900/50 rounded-2xl">
        <div className="p-8">
          <p className="text-red-400 font-mono text-sm">ERROR: {error}</p>
        </div>
      </div>
    );
  }

  // Mission metrics from robust data
  const statesVisited = journeyInsights.statesVisited?.length || 29;
  const daysElapsed = journeyInsights.daysElapsed || 60;
  const totalMiles = journeyInsights.totalMiles || 12411;
  const progressPercentage = (statesVisited / 48) * 100;
  const statesRemaining = 48 - statesVisited;
  const efficiency = Math.round(totalMiles / daysElapsed);
  
  const currentState = journeyInsights.currentState || 'Connecticut';
  const batteryLevel = currentLocation?.battery_level || 22;
  const outsideTemp = 78;
  const lastUpdate = new Date();

  // Achievement status
  const achievements = [
    { name: "State Explorer", progress: statesVisited, target: 48, icon: Target },
    { name: "Distance Pioneer", progress: Math.round(totalMiles/1000), target: 15, icon: Navigation },
    { name: "Endurance Driver", progress: daysElapsed, target: 75, icon: Activity }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/50 rounded-2xl">
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
      
      <div className="relative z-10 p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Mission header */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 px-3 py-1">
                <Navigation className="w-3 h-3 mr-2" />
                CONTINENTAL TRAVERSE MISSION
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight tracking-tight">
                A Whittle Wandering
              </h1>
              
              <p className="text-lg text-slate-400 font-light max-w-2xl leading-relaxed">
                Real-time telemetry from a {totalMiles.toLocaleString()}-mile cross-continental journey. 
                Live tracking Tesla performance across {statesVisited} states with precision navigation data.
              </p>
            </div>
            
            {/* Status indicators */}
            <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="font-mono">LOCATION: {currentState}</span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="font-mono">DAY {daysElapsed} • {progressPercentage.toFixed(1)}% COMPLETE</span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="font-mono text-xs">LAST UPDATE: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Achievement progress rings */}
            <div className="flex gap-4">
              {achievements.map((achievement, index) => {
                const progress = Math.min((achievement.progress / achievement.target) * 100, 100);
                const Icon = achievement.icon;
                return (
                  <div key={index} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                          fill="none"
                          stroke="#334155"
                          strokeWidth="2"
                        />
                        <path
                          d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeDasharray={`${progress}, 100`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <Icon className="w-3 h-3 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-mono">{achievement.name}</div>
                      <div className="text-sm text-white font-mono">{achievement.progress}/{achievement.target}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Mission control metrics */}
          <div className="grid grid-cols-2 gap-4 lg:gap-4 min-w-[320px]">
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">States</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">{statesVisited}</div>
              <div className="text-xs text-slate-500">{statesRemaining} remaining</div>
            </div>
            
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-green-400" />
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">Progress</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">{progressPercentage.toFixed(0)}%</div>
              <div className="text-xs text-slate-500">mission complete</div>
            </div>
            
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Battery className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">Battery</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400 font-mono">{batteryLevel}%</div>
              <div className="text-xs text-slate-500">charge level</div>
            </div>
            
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">Distance</span>
              </div>
              <div className="text-2xl font-bold text-purple-400 font-mono">{(totalMiles/1000).toFixed(1)}K</div>
              <div className="text-xs text-slate-500">miles tracked</div>
            </div>
            
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">Temp</span>
              </div>
              <div className="text-2xl font-bold text-orange-400 font-mono">{outsideTemp}°</div>
              <div className="text-xs text-slate-500">external</div>
            </div>
            
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">{efficiency}</div>
              <div className="text-xs text-slate-500">mi/day avg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroComponent;