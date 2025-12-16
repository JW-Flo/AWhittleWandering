import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  MapPin, 
  Zap, 
  Route, 
  Mountain,
  ChevronLeft,
  Medal,
  TreePine,
  Building2
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  displayName: string;
  avatar?: string;
  value: number;
  unit: string;
  journeyName?: string;
  isCurrentUser?: boolean;
}

// Mock data - will be replaced with real data from Supabase
const mockLeaderboards = {
  totalMiles: [
    { rank: 1, username: 'aww_joe', displayName: 'Joe Whittle', value: 15847, unit: 'mi', journeyName: 'A Whittle Wandering', isCurrentUser: true },
    { rank: 2, username: 'tesla_nomad', displayName: 'Tesla Nomad', value: 12450, unit: 'mi', journeyName: 'West Coast Express' },
    { rank: 3, username: 'ev_explorer', displayName: 'EV Explorer', value: 9823, unit: 'mi', journeyName: 'Route 66 Revival' },
    { rank: 4, username: 'road_tripper', displayName: 'Road Tripper', value: 7654, unit: 'mi', journeyName: 'Mountain Quest' },
    { rank: 5, username: 'wanderlust_watt', displayName: 'Wanderlust Watt', value: 5432, unit: 'mi', journeyName: 'Desert Dreams' },
  ],
  statesVisited: [
    { rank: 1, username: 'aww_joe', displayName: 'Joe Whittle', value: 48, unit: 'states', journeyName: 'A Whittle Wandering', isCurrentUser: true },
    { rank: 2, username: 'state_collector', displayName: 'State Collector', value: 42, unit: 'states', journeyName: 'All 50 Challenge' },
    { rank: 3, username: 'cross_country', displayName: 'Cross Country', value: 38, unit: 'states', journeyName: 'Coast to Coast' },
    { rank: 4, username: 'ev_explorer', displayName: 'EV Explorer', value: 31, unit: 'states', journeyName: 'Route 66 Revival' },
    { rank: 5, username: 'road_tripper', displayName: 'Road Tripper', value: 24, unit: 'states', journeyName: 'Mountain Quest' },
  ],
  nationalParks: [
    { rank: 1, username: 'park_ranger', displayName: 'Park Ranger', value: 28, unit: 'parks', journeyName: 'NPS Grand Tour' },
    { rank: 2, username: 'aww_joe', displayName: 'Joe Whittle', value: 15, unit: 'parks', journeyName: 'A Whittle Wandering', isCurrentUser: true },
    { rank: 3, username: 'nature_lover', displayName: 'Nature Lover', value: 12, unit: 'parks', journeyName: 'Western Parks' },
    { rank: 4, username: 'ev_explorer', displayName: 'EV Explorer', value: 9, unit: 'parks', journeyName: 'Route 66 Revival' },
    { rank: 5, username: 'road_tripper', displayName: 'Road Tripper', value: 7, unit: 'parks', journeyName: 'Mountain Quest' },
  ],
  efficiency: [
    { rank: 1, username: 'hypermiler', displayName: 'Hypermiler Pro', value: 4.2, unit: 'mi/kWh', journeyName: 'Efficiency Challenge' },
    { rank: 2, username: 'smooth_driver', displayName: 'Smooth Driver', value: 3.8, unit: 'mi/kWh', journeyName: 'Gentle Journey' },
    { rank: 3, username: 'eco_warrior', displayName: 'Eco Warrior', value: 3.5, unit: 'mi/kWh', journeyName: 'Green Route' },
    { rank: 4, username: 'aww_joe', displayName: 'Joe Whittle', value: 2.29, unit: 'mi/kWh', journeyName: 'A Whittle Wandering', isCurrentUser: true },
    { rank: 5, username: 'ev_newbie', displayName: 'EV Newbie', value: 2.1, unit: 'mi/kWh', journeyName: 'First Adventure' },
  ],
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 2: return <Medal className="w-5 h-5 text-gray-400" />;
    case 3: return <Medal className="w-5 h-5 text-amber-700" />;
    default: return <span className="w-5 h-5 text-center text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
};

const LeaderboardTable = ({ entries, icon: Icon }: { entries: LeaderboardEntry[], icon: React.ElementType }) => (
  <div className="space-y-2">
    {entries.map((entry) => (
      <div 
        key={entry.rank}
        className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
          entry.isCurrentUser 
            ? 'bg-primary/10 border border-primary/30' 
            : 'bg-secondary/50 hover:bg-secondary'
        }`}
      >
        <div className="w-8 flex justify-center">
          {getRankIcon(entry.rank)}
        </div>
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={entry.avatar} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {entry.displayName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{entry.displayName}</span>
            {entry.isCurrentUser && (
              <Badge variant="outline" className="text-xs border-primary/50 text-primary">You</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{entry.journeyName}</p>
        </div>
        
        <div className="flex items-center gap-2 text-right">
          <Icon className="w-4 h-4 text-primary" />
          <span className="font-bold text-lg">{entry.value.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">{entry.unit}</span>
        </div>
      </div>
    ))}
  </div>
);

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('miles');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                AWW Leaderboard
              </h1>
              <p className="text-sm text-muted-foreground">See how your adventures compare</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="card-nature">
          <CardHeader>
            <CardTitle className="text-lg">Community Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-secondary mb-6">
                <TabsTrigger value="miles" className="flex items-center gap-1">
                  <Route className="w-4 h-4" />
                  <span className="hidden sm:inline">Miles</span>
                </TabsTrigger>
                <TabsTrigger value="states" className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">States</span>
                </TabsTrigger>
                <TabsTrigger value="parks" className="flex items-center gap-1">
                  <TreePine className="w-4 h-4" />
                  <span className="hidden sm:inline">Parks</span>
                </TabsTrigger>
                <TabsTrigger value="efficiency" className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Efficiency</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="miles">
                <LeaderboardTable entries={mockLeaderboards.totalMiles} icon={Route} />
              </TabsContent>
              
              <TabsContent value="states">
                <LeaderboardTable entries={mockLeaderboards.statesVisited} icon={MapPin} />
              </TabsContent>
              
              <TabsContent value="parks">
                <LeaderboardTable entries={mockLeaderboards.nationalParks} icon={TreePine} />
              </TabsContent>
              
              <TabsContent value="efficiency">
                <LeaderboardTable entries={mockLeaderboards.efficiency} icon={Zap} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Your Stats Summary */}
        <Card className="card-nature mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <Route className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">15,847</p>
                <p className="text-xs text-muted-foreground">Total Miles</p>
                <Badge variant="outline" className="mt-1 text-xs">Rank #1</Badge>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">48</p>
                <p className="text-xs text-muted-foreground">States Visited</p>
                <Badge variant="outline" className="mt-1 text-xs">Rank #1</Badge>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <TreePine className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">15</p>
                <p className="text-xs text-muted-foreground">National Parks</p>
                <Badge variant="outline" className="mt-1 text-xs">Rank #2</Badge>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">2.29</p>
                <p className="text-xs text-muted-foreground">mi/kWh Avg</p>
                <Badge variant="outline" className="mt-1 text-xs">Rank #4</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
