import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Route,
  DollarSign,
  Leaf,
  Battery
} from 'lucide-react';

interface JourneyInsights {
  totalDistance: number;
  totalEnergy: number;
  averageEfficiency: number;
  carbonSaved: number;
  costSavings: number;
}

interface AnalyticsDashboardProps {
  insights?: JourneyInsights;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export const AdvancedAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  insights = {
    totalDistance: 15847,
    totalEnergy: 6915,
    averageEfficiency: 2.29,
    carbonSaved: 12478,
    costSavings: 5234.40,
  },
  timeRange = '90d'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'efficiency' | 'cost' | 'carbon'>('efficiency');

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  const formatDistance = (miles: number) => `${miles.toLocaleString()} mi`;

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-tesla">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Distance</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatDistance(insights.totalDistance)}
                </p>
              </div>
              <Route className="h-8 w-8 text-tesla-blue" />
            </div>
            <div className="mt-2">
              <Badge className="text-xs bg-tesla-blue/20 text-tesla-blue border-0">
                48 States
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-tesla">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Energy Efficiency</p>
                <p className="text-2xl font-bold text-foreground">
                  {insights.averageEfficiency.toFixed(2)} mi/kWh
                </p>
              </div>
              <Zap className="h-8 w-8 text-adventure-green" />
            </div>
            <div className="mt-2">
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-tesla">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(insights.costSavings)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-adventure-gold" />
            </div>
            <div className="mt-2">
              <Badge className="text-xs bg-adventure-gold/20 text-adventure-gold border-0">
                vs gasoline
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-tesla">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carbon Saved</p>
                <p className="text-2xl font-bold text-foreground">
                  {insights.carbonSaved.toLocaleString()} lbs
                </p>
              </div>
              <Leaf className="h-8 w-8 text-adventure-green" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs border-adventure-green/30 text-adventure-green">
                CO₂ equivalent
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card className="card-tesla">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient-primary">
            <BarChart3 className="h-5 w-5" />
            Journey Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as 'efficiency' | 'cost' | 'carbon')}>
            <TabsList className="grid w-full grid-cols-3 bg-secondary">
              <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
              <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
              <TabsTrigger value="carbon">Environmental</TabsTrigger>
            </TabsList>

            <TabsContent value="efficiency" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-secondary border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Efficiency Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Current Average</span>
                        <span className="font-medium">2.29 mi/kWh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Best Day</span>
                        <span className="font-medium text-adventure-green">3.8 mi/kWh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Worst Day</span>
                        <span className="font-medium text-adventure-orange">1.6 mi/kWh</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-secondary border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Efficiency Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Weather Impact</span>
                        <Badge className="bg-adventure-red/20 text-adventure-red border-0">-12%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Elevation Changes</span>
                        <Badge className="bg-adventure-orange/20 text-adventure-orange border-0">-8%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Speed Optimization</span>
                        <Badge className="bg-adventure-green/20 text-adventure-green border-0">+5%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cost" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-secondary border-border">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Charging Cost</p>
                      <p className="text-2xl font-bold">{formatCurrency(1847)}</p>
                      <p className="text-xs text-adventure-green">259 sessions</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-secondary border-border">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Cost per Mile</p>
                      <p className="text-2xl font-bold">$0.12</p>
                      <p className="text-xs text-adventure-green">vs $0.35 gas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-secondary border-border">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Avg Session Cost</p>
                      <p className="text-2xl font-bold">$7.13</p>
                      <p className="text-xs text-muted-foreground">26.7 kWh avg</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="carbon" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-secondary border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Environmental Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">CO₂ Avoided</span>
                        <span className="font-medium">{insights.carbonSaved.toLocaleString()} lbs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Equivalent Trees</span>
                        <span className="font-medium">142 trees/year</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Gasoline Saved</span>
                        <span className="font-medium">634 gallons</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-secondary border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Charging Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Superchargers</span>
                        <Badge className="bg-tesla-blue/20 text-tesla-blue border-0">78%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Destination</span>
                        <Badge className="bg-adventure-green/20 text-adventure-green border-0">15%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Level 2</span>
                        <Badge className="bg-adventure-purple/20 text-adventure-purple border-0">7%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Insights & Recommendations */}
      <Card className="card-tesla">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient-primary">
            <TrendingUp className="h-5 w-5" />
            Journey Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-tesla-blue/10 rounded-lg border border-tesla-blue/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-tesla-blue/20 rounded">
                  <Zap className="h-4 w-4 text-tesla-blue" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Efficiency Champion</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your best efficiency was 3.8 mi/kWh on a 300-mile stretch through Nebraska. 
                    Flat terrain and 65°F weather contributed to this personal best.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-adventure-green/10 rounded-lg border border-adventure-green/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-adventure-green/20 rounded">
                  <DollarSign className="h-4 w-4 text-adventure-green" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Cost Savings</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Compared to a 30 MPG vehicle at $3.50/gallon, you saved over $5,200 
                    in fuel costs during this 89-day adventure.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-adventure-purple/10 rounded-lg border border-adventure-purple/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-adventure-purple/20 rounded">
                  <Battery className="h-4 w-4 text-adventure-purple" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Charging Pattern</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    You averaged 178 miles between charging stops. The longest single drive 
                    was 287 miles from Denver to Salt Lake City.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
