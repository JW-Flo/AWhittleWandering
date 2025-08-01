import { useState, useEffect } from 'react';
import { useUnifiedTessieApi } from './useUnifiedTessieApi';
import { journeyTimelineProcessor, AdvancedJourneyInsights } from '@/services/journeyTimelineProcessor';
import { driveAnalysisService } from '@/services/driveAnalysisService';

// Static fallback data for when API is unavailable
const FALLBACK_DATA = {
  totalStatesVisited: 29,
  totalDrivingDays: 45,
  accurateStateCount: 29,
  stateCrossings: 28,
  currentLocation: "Exploring the Continental USA",
  uniqueRegions: ["Southwest", "West Coast", "Mountain West"],
  weatherSeasons: ["Summer"],
  terrainTypes: ["Desert", "Mountains", "Coastal"],
  routeComplexity: "complex" as const,
  journeyScore: 750,
  currentPosition: {
    state: "Washington",
    coordinates: { lat: 47.6062, lng: -122.3321 },
    lastUpdate: new Date().toISOString()
  },
  timelineEntries: [
    {
      date: "2025-06-01",
      state: "Texas",
      location: "Austin, TX",
      description: "Journey began in the heart of Texas",
      category: "departure" as const,
      coordinates: { lat: 30.2672, lng: -97.7431 }
    },
    {
      date: "2025-06-15",
      state: "Colorado",
      location: "Denver, CO", 
      description: "Reached the Mile High City",
      category: "milestone" as const,
      coordinates: { lat: 39.7392, lng: -104.9903 }
    },
    {
      date: "2025-07-01",
      state: "California",
      location: "San Francisco, CA",
      description: "Arrived at the Pacific Coast",
      category: "milestone" as const,
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    {
      date: "2025-07-20",
      state: "Washington",
      location: "Seattle, WA",
      description: "Reached the Pacific Northwest",
      category: "arrival" as const,
      coordinates: { lat: 47.6062, lng: -122.3321 }
    }
  ],
  routePoints: [
    { latitude: 30.2672, longitude: -97.7431, state: "Texas", date: "2025-06-01", address: "Austin, TX", driveIndex: 0, category: "drive", significance: "high" },
    { latitude: 39.7392, longitude: -104.9903, state: "Colorado", date: "2025-06-15", address: "Denver, CO", driveIndex: 1, category: "drive", significance: "medium" },
    { latitude: 37.7749, longitude: -122.4194, state: "California", date: "2025-07-01", address: "San Francisco, CA", driveIndex: 2, category: "drive", significance: "high" },
    { latitude: 47.6062, longitude: -122.3321, state: "Washington", date: "2025-07-20", address: "Seattle, WA", driveIndex: 3, category: "drive", significance: "high" }
  ],
  journeyPhases: [],
  milestones: []
};

export interface JourneyInsights extends AdvancedJourneyInsights {
  timelineEntries: Array<{
    date: string;
    state: string;
    location: string;
    description: string;
    category: 'departure' | 'arrival' | 'milestone' | 'overnight' | 'activity';
    coordinates: { lat: number; lng: number };
  }>;
  routePoints: Array<{
    latitude: number;
    longitude: number;
    state: string;
    date: string;
    address: string;
    driveIndex: number;
    category: string;
    significance: string;
  }>;
}

export const useRobustData = () => {
  const [insights, setInsights] = useState<JourneyInsights>(FALLBACK_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'fallback'>('fallback');
  const [processingStage, setProcessingStage] = useState<string>('Initializing...');

  const { historicalDrives: drives, isLoading: apiLoading, error: apiError } = useUnifiedTessieApi();

  useEffect(() => {
    const processData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if we have real drive data
        if (drives && drives.length > 0) {
          console.log('🚀 Starting sophisticated drive analysis...', { driveCount: drives.length });
          
          setProcessingStage('Analyzing drive patterns...');
          
          // Use sophisticated analysis services
          const advancedInsights = await journeyTimelineProcessor.processJourneyTimeline(drives);
          const { segments, timeline } = driveAnalysisService.analyzeJourneyFromDrives(drives);
          
          setProcessingStage('Generating route waypoints...');
          
          // Generate enhanced route points
          const routePoints = driveAnalysisService.generateRouteWaypoints(segments);
          
          setProcessingStage('Creating timeline entries...');
          
          // Convert sophisticated timeline to simple format for compatibility
          const timelineEntries = timeline.map(entry => ({
            date: entry.date,
            state: entry.state,
            location: entry.location,
            description: entry.description,
            category: entry.category,
            coordinates: entry.coordinates
          }));

          setProcessingStage('Finalizing insights...');

          const processedInsights: JourneyInsights = {
            ...advancedInsights,
            timelineEntries: timelineEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            routePoints: routePoints.filter(point => point.latitude !== 0 && point.longitude !== 0)
          };

          console.log('✅ Sophisticated analysis complete:', {
            states: processedInsights.totalStatesVisited,
            accurateStates: processedInsights.accurateStateCount,
            regions: processedInsights.uniqueRegions.length,
            phases: processedInsights.journeyPhases.length,
            milestones: processedInsights.milestones.length,
            complexity: processedInsights.routeComplexity,
            score: processedInsights.journeyScore,
            timelineEntries: processedInsights.timelineEntries.length,
            routePoints: processedInsights.routePoints.length
          });

          setInsights(processedInsights);
          setDataSource('api');
        } else if (apiError) {
          console.warn('⚠️ API error, using fallback data:', apiError);
          setInsights(FALLBACK_DATA);
          setDataSource('fallback');
          setError(apiError);
        } else {
          console.log('📊 Using fallback data (no drives available)');
          setInsights(FALLBACK_DATA);
          setDataSource('fallback');
        }
      } catch (err) {
        console.error('❌ Error processing sophisticated data:', err);
        setInsights(FALLBACK_DATA);
        setDataSource('fallback');
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
        setProcessingStage('Complete');
      }
    };

    if (!apiLoading) {
      processData();
    }
  }, [drives, apiLoading, apiError]);

  return {
    insights,
    isLoading: isLoading || apiLoading,
    error,
    dataSource,
    processingStage
  };
};
