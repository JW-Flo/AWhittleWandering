import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Route, Clock, Trophy, Zap, Star } from 'lucide-react';
import { useRobustData } from '@/hooks/useRobustData';

interface TimelineEntry {
  date: string;
  state: string;
  keyStops: string;
  type?: 'adventure' | 'milestone' | 'scenic' | 'cultural';
}

interface TimelineDataDisplayProps {
  tessieApiKey?: string;
}

const TimelineDataDisplay: React.FC<TimelineDataDisplayProps> = ({ tessieApiKey }) => {
  const { drives, charges, currentLocation, journeyInsights, loading, error } = useRobustData();

  if (loading) {
    return (
      <Card className="story-card animate-pulse">
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-6 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="story-card border-destructive/20">
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Timeline loading error: {error}</p>
            <p className="text-sm text-muted-foreground">Showing backup adventure data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Epic journey timeline data
  const journeyTimeline: TimelineEntry[] = [
    { date: '🚀 June 1', state: 'Texas', keyStops: 'JOURNEY BEGINS! Starting from Corpus Christi', type: 'milestone' },
    { date: 'June 2–3', state: 'New Mexico', keyStops: '🏜️ Carlsbad Caverns - Underground wonderland!', type: 'scenic' },
    { date: 'June 4', state: 'Texas', keyStops: '🛣️ Fort Stockton overnight - Desert highway', type: 'adventure' },
    { date: 'June 5', state: 'Texas', keyStops: '🔧 El Paso Tesla service - Vehicle preparation', type: 'adventure' },
    { date: 'June 6–7', state: 'Arizona', keyStops: '🌄 Sedona & Grand Canyon Desert View Watchtower!', type: 'scenic' },
    { date: 'June 8', state: 'Utah', keyStops: '⛰️ Zion National Park - First Utah exploration!', type: 'scenic' },
    { date: 'June 9', state: 'Nevada', keyStops: '🎰 Vegas drive-through - Desert oasis', type: 'cultural' },
    { date: 'June 9', state: 'California', keyStops: '🌴 Vegas → Los Angeles - Pacific coast bound!', type: 'milestone' },
    { date: 'June 9–13', state: 'California', keyStops: '🏖️ 4 days in LA, then PCH northbound!', type: 'adventure' },
    { date: 'June 14', state: 'California', keyStops: '🌲 Redwoods National Park - Giants of the coast!', type: 'scenic' },
    { date: 'June 15', state: 'Oregon', keyStops: '🌊 Cannon Beach - Iconic Pacific coastline', type: 'scenic' },
    { date: 'June 16', state: 'Washington', keyStops: '⛰️ Verlot, Mount Baker-Snoqualmie wilderness', type: 'adventure' },
    { date: 'June 17', state: 'Washington', keyStops: '🌲 Sequim - Olympic Peninsula', type: 'scenic' },
    { date: 'June 18', state: 'Washington', keyStops: '🏙️ Seattle with Brian - City exploration!', type: 'cultural' },
    { date: 'June 19', state: 'Washington', keyStops: '🥾 Quincy hike - Mountain trail', type: 'adventure' },
    { date: 'June 20', state: 'Idaho', keyStops: '🏕️ Coeur d\'Alene camping - Lake paradise overnight', type: 'adventure' },
    { date: 'June 21', state: 'Montana', keyStops: '🏔️ Bozeman - Big Sky country begins!', type: 'scenic' },
    { date: 'June 22', state: 'Montana', keyStops: '⛰️ Big Sky - SUMMITED LONE MOUNTAIN! 🏔️', type: 'milestone' },
    { date: 'June 23–24', state: 'Wyoming', keyStops: '🌋 Yellowstone National Park - Geothermal wonderland!', type: 'scenic' },
    { date: 'June 25–26', state: 'Utah', keyStops: '🏔️ Salt Lake City → 2-day Provo exploration', type: 'adventure' },
    { date: 'June 27–28', state: 'Colorado', keyStops: '🏔️ Denver (Josh) & Fort Collins (Caleb) reunion!', type: 'cultural' },
    { date: 'July 3', state: 'Nebraska', keyStops: '🌾 Arrived Lincoln for 4-day stay', type: 'adventure' },
    { date: 'July 4', state: 'Iowa', keyStops: '🇺🇸 Council Bluffs 4th of July drive-through', type: 'cultural' },
    { date: 'July 4', state: 'South Dakota', keyStops: '🏜️ Council Bluffs → Badlands discovery!', type: 'scenic' },
    { date: 'July 5', state: 'North Dakota', keyStops: '🌾 Fargo dinner & overnight - Prairie charm', type: 'cultural' },
    { date: 'July 6', state: 'Minnesota', keyStops: '🏙️ Minneapolis - Twin Cities exploration', type: 'cultural' },
    { date: 'July 7', state: 'Wisconsin', keyStops: '🧀 Mars Cheese Castle (Kenosha) - Cheese heaven!', type: 'cultural' },
    { date: 'July 8', state: 'Illinois', keyStops: '⚾ Chicago Wrigleyville & met Connor McBride!', type: 'cultural' },
    { date: 'July 9', state: 'Indiana', keyStops: '🌲 Terre Haute (Jack Lavey) & Turkey Run State Park', type: 'adventure' },
    { date: 'July 10', state: 'Ohio', keyStops: '🌊 John Bryan SP & Clifton Gorge waterfalls', type: 'scenic' },
    { date: 'July 11–12', state: 'Ohio', keyStops: '🏙️ 2 nights Cincinnati with Cameron Hynes', type: 'cultural' },
    { date: 'July 13', state: 'Pennsylvania', keyStops: '🌊 Erie & Lake Erie shoreline beauty', type: 'scenic' },
    { date: 'July 14', state: 'New York', keyStops: '🏛️ Albany with Phil Dalton - Capital exploration', type: 'cultural' },
    { date: 'July 15', state: 'Vermont', keyStops: '🌲 Green Mountain National Forest wilderness', type: 'scenic' },
    { date: 'July 16', state: 'New Hampshire', keyStops: '⛰️ White Mountain Visitor Center', type: 'scenic' },
    { date: 'July 17–18', state: 'Maine', keyStops: '🌅 Bar Harbor & Cadillac Mountain SUNRISE HIKE!', type: 'milestone' },
    { date: 'July 19', state: 'Massachusetts', keyStops: '🏛️ Drive-through → Connecticut bound', type: 'adventure' },
    { date: 'July 20–26', state: 'Connecticut', keyStops: '🏡 Stratford stay with Deanna - Home base', type: 'cultural' },
    { date: 'July 25', state: 'Rhode Island', keyStops: '🌊 Watch Hill Point coastal discovery!', type: 'scenic' }
  ];

  const totalMiles = journeyInsights.totalMiles || 12411;
  const statesVisited = journeyInsights.statesVisited?.length || 29;
  const daysElapsed = journeyInsights.daysElapsed || 60;
  const averageDailyMiles = Math.round(totalMiles / daysElapsed);
  const progressPercentage = (statesVisited / 48) * 100;

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'milestone': return Star;
      case 'scenic': return Route;
      case 'adventure': return Zap;
      case 'cultural': return Calendar;
      default: return MapPin;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'milestone': return 'text-amber-400 bg-amber-400/20';
      case 'scenic': return 'text-emerald-400 bg-emerald-400/20';
      case 'adventure': return 'text-orange-400 bg-orange-400/20';
      case 'cultural': return 'text-slate-400 bg-slate-400/20';
      default: return 'text-teal-400 bg-teal-400/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Journey Overview */}
      <Card className="bg-gradient-to-br from-slate-900/30 via-emerald-900/30 to-green-900/30 border-emerald-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-bold text-white">
            <Trophy className="w-8 h-8 text-amber-400" />
            Journey Overview
            <Badge className="bg-amber-400/20 text-amber-400 text-sm">LIVE TRACKING</Badge>
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

      {/* Journey Timeline */}
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
              {journeyTimeline.map((entry, index) => {
                const IconComponent = getTypeIcon(entry.type);
                const colorClasses = getTypeColor(entry.type);
                
                return (
                  <div key={index} className="group relative">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-gray-700/50 hover:to-gray-800/50 transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50 backdrop-blur-sm">
                      <div className={`p-2 rounded-full ${colorClasses} flex-shrink-0 mt-1`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className="bg-emerald-500/20 text-emerald-400 px-3 py-1 font-medium">
                            {entry.date}
                          </Badge>
                          <Badge className="bg-gradient-to-r from-slate-500/20 to-teal-500/20 text-slate-300 px-3 py-1 font-medium border border-slate-500/30">
                            {entry.state}
                          </Badge>
                          {entry.type && (
                            <Badge className={`${colorClasses} px-2 py-1 text-xs font-medium border border-current/30`}>
                              {entry.type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-200 leading-relaxed font-medium">
                          {entry.keyStops}
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
