import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Activity } from 'lucide-react';
import { JourneyAnalytics } from '@/types/advancedFeatures';

interface AnalyticsDashboardProps {
  journeyData: any[];
  realTimeUpdates?: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  journeyData,
  realTimeUpdates: _realTimeUpdates = true
}) => {
  const [_selectedMetric, _setSelectedMetric] = useState<'efficiency' | 'cost' | 'time'>('efficiency');

  // Simulate analytics processing with gemma3
  const analytics = useMemo((): JourneyAnalytics => {
    const totalDistance = journeyData.reduce((sum, journey) => sum + (journey.distance || 0), 0);
    const totalTime = journeyData.reduce((sum, journey) => sum + (journey.duration || 0), 0);
    
    return {
      totalDistance,
      totalTime,
      energyEfficiency: 94.2,
      costAnalysis: {
        electricityCost: 45.67,
        gasolineEquivalent: 127.89,
        savings: 82.22,
        carbonFootprint: 0.12
      },
      comparisonMetrics: {
        previousTrips: [
          { date: '2025-07-01', efficiency: 91.5, cost: 52.10, duration: 280 },
          { date: '2025-06-15', efficiency: 89.2, cost: 58.45, duration: 295 }
        ],
        benchmarks: [
          { category: 'Efficiency', userValue: 94.2, averageValue: 87.3, percentile: 85 },
          { category: 'Cost Savings', userValue: 82.22, averageValue: 65.40, percentile: 92 }
        ],
        improvements: [
          'Route optimization improved by 12%',
          'Charging efficiency up 8%',
          'Weather impact reduced by 15%'
        ]
      },
      insights: [
        {
          id: 'insight_1',
          type: 'efficiency',
          title: 'Optimal Charging Strategy',
          description: 'Charging at 80% vs 100% saves 25 minutes per trip',
          impact: 'high',
          actionable: true,
          recommendation: 'Set charging limit to 80% for daily trips'
        },
        {
          id: 'insight_2',
          type: 'route',
          title: 'Traffic Pattern Analysis',
          description: 'Leaving 30 minutes earlier reduces travel time by 18%',
          impact: 'medium',
          actionable: true,
          recommendation: 'Adjust departure time for optimal efficiency'
        }
      ]
    };
  }, [journeyData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            🔥 TRACK 2: Analytics Dashboard (gemma3)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.energyEfficiency}%</div>
              <div className="text-sm text-gray-600">Energy Efficiency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">${analytics.costAnalysis.savings}</div>
              <div className="text-sm text-gray-600">Monthly Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.totalDistance.toFixed(0)} mi</div>
              <div className="text-sm text-gray-600">Total Distance</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Efficiency vs Average</span>
                <span className="text-sm text-green-600">+12% above average</span>
              </div>
              <Progress value={85} className="h-3" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Cost Optimization</span>
                <span className="text-sm text-blue-600">92nd percentile</span>
              </div>
              <Progress value={92} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI-Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.insights.map(insight => (
              <div key={insight.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{insight.title}</h4>
                  <Badge variant={insight.impact === 'high' ? 'default' : 'secondary'}>
                    {insight.impact} impact
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                {insight.recommendation && (
                  <div className="text-sm bg-blue-50 p-2 rounded">
                    💡 {insight.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
