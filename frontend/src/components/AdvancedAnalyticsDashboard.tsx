import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  JourneyInsights
} from '@/types/enhanced-features';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Route,
  DollarSign,
  Leaf,
  Battery
} from 'lucide-react';

interface AnalyticsDashboardProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onInsightGenerated?: (insight: JourneyInsights) => void;
}

export const AdvancedAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeRange = '30d',
  onInsightGenerated
}) => {
  const [insights, setInsights] = useState<JourneyInsights | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'efficiency' | 'cost' | 'carbon'>('efficiency');

  // This will be implemented by gemma3 model
  const generateJourneyInsights = useCallback(async () => {
    console.warn('🤖 Delegating journey analytics to gemma3...');
    
    // Placeholder insights - will be replaced by AI analysis
    const mockInsights: JourneyInsights = {
      totalDistance: 2847.5,
      totalEnergy: 856.2,
      averageEfficiency: 3.33,
      carbonSaved: 1247.8,
      costSavings: 523.40,
      favoriteRoutes: [],
      chargingPatterns: [],
      seasonalTrends: []
    };
    
    setInsights(mockInsights);
    onInsightGenerated?.(mockInsights);
  }, [onInsightGenerated]);

  // This will be implemented by gemma3 model
  const analyzeEnergyEfficiency = async () => {
    console.warn('🤖 Delegating efficiency analysis to gemma3...');
    // TODO: Implement comprehensive efficiency analysis
  };

  // This will be implemented by gemma3 model
  const generateTripComparisons = async () => {
    console.warn('🤖 Delegating trip comparison analysis to gemma3...');
    // TODO: Implement intelligent trip comparison and optimization suggestions
  };

  useEffect(() => {
    generateJourneyInsights();
    analyzeEnergyEfficiency();
    generateTripComparisons();
  }, [timeRange, generateJourneyInsights]); // Added generateJourneyInsights to dependencies

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDistance = (miles: number) => `${miles.toLocaleString()} mi`;

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Distance</p>
                <p className="text-2xl font-bold">
                  {insights ? formatDistance(insights.totalDistance) : '---'}
                </p>
              </div>
              <Route className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                +12% vs last period
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Energy Efficiency</p>
                <p className="text-2xl font-bold">
                  {insights ? `${insights.averageEfficiency.toFixed(2)} mi/kWh` : '---'}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Savings</p>
                <p className="text-2xl font-bold">
                  {insights ? formatCurrency(insights.costSavings) : '---'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="mt-2">
              <Badge variant="default" className="text-xs">
                vs gasoline
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Carbon Saved</p>
                <p className="text-2xl font-bold">
                  {insights ? `${insights.carbonSaved.toFixed(0)} lbs` : '---'}
                </p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                CO₂ equivalent
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Journey Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as 'efficiency' | 'cost' | 'carbon')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
              <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
              <TabsTrigger value="carbon">Environmental</TabsTrigger>
            </TabsList>

            <TabsContent value="efficiency" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Efficiency Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Trip</span>
                        <span className="font-medium">3.8 mi/kWh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">7-day Average</span>
                        <span className="font-medium">3.5 mi/kWh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Personal Best</span>
                        <span className="font-medium text-green-600">4.2 mi/kWh</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Efficiency Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Weather Impact</span>
                        <Badge variant="secondary">-8%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Driving Style</span>
                        <Badge variant="default">+12%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Route Selection</span>
                        <Badge variant="default">+5%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cost" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Charging Cost</p>
                      <p className="text-2xl font-bold">{formatCurrency(124.60)}</p>
                      <p className="text-xs text-green-600">-15% vs avg</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Cost per Mile</p>
                      <p className="text-2xl font-bold">$0.044</p>
                      <p className="text-xs text-green-600">vs $0.12 gas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Monthly Savings</p>
                      <p className="text-2xl font-bold">{formatCurrency(247.80)}</p>
                      <p className="text-xs text-gray-600">vs ICE vehicle</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="carbon" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Environmental Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">CO₂ Avoided</span>
                        <span className="font-medium">{insights?.carbonSaved.toFixed(0)} lbs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Equivalent Trees</span>
                        <span className="font-medium">14.2 trees/year</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Grid Efficiency</span>
                        <span className="font-medium">72% renewable</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Carbon Intensity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Home Charging</span>
                        <Badge variant="default">0.45 lbs/kWh</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Public Charging</span>
                        <Badge variant="secondary">0.62 lbs/kWh</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Solar Charging</span>
                        <Badge variant="outline">0.00 lbs/kWh</Badge>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Efficiency Opportunity</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Your efficiency improves by 18% when departing before 9 AM. 
                    Consider adjusting departure times for longer trips.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-green-100 rounded">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Cost Optimization</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Switching to off-peak charging could save you an additional $23/month 
                    based on your driving patterns.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-purple-100 rounded">
                  <Battery className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Charging Pattern</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Your battery health could improve by maintaining charge between 20-80% 
                    for daily use, reserving 100% for road trips.
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
