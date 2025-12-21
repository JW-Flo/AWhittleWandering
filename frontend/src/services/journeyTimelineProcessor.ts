import { HistoricalDrive } from '@/hooks/useUnifiedTessieApi';
import { driveAnalysisService, JourneySegment, JourneyStatistics } from './driveAnalysisService';

export interface AdvancedJourneyInsights {
  totalStatesVisited: number;
  totalDrivingDays: number;
  accurateStateCount: number;
  stateCrossings: number;
  uniqueRegions: string[];
  weatherSeasons: string[];
  terrainTypes: string[];
  journeyPhases: JourneyPhase[];
  currentPosition: {
    state: string;
    coordinates: { lat: number; lng: number };
    lastUpdate: string;
  };
  milestones: AdvancedMilestone[];
  routeComplexity: 'simple' | 'moderate' | 'complex' | 'epic';
  journeyScore: number;
}

export interface JourneyPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  states: string[];
  theme: string;
  description: string;
  significance: 'exploration' | 'transit' | 'destination' | 'adventure';
  terrain: string[];
  weatherConditions: string[];
}

export interface AdvancedMilestone {
  id: string;
  date: string;
  state: string;
  location: string;
  type: 'state_entry' | 'summit' | 'national_park' | 'border' | 'endpoint' | 'elevation' | 'distance';
  title: string;
  description: string;
  coordinates: { lat: number; lng: number };
  significance: 'low' | 'medium' | 'high' | 'epic';
  metrics?: {
    elevation?: number;
    totalMiles?: number;
    stateNumber?: number;
  };
}

export class JourneyTimelineProcessor {
  private regions = {
    'Southwest': ['TX', 'NM', 'AZ', 'UT', 'NV', 'CO'],
    'West Coast': ['CA', 'OR', 'WA'],
    'Mountain West': ['ID', 'MT', 'WY', 'CO', 'UT'],
    'Great Plains': ['NE', 'KS', 'OK', 'ND', 'SD'],
    'Midwest': ['IA', 'MN', 'WI', 'IL', 'IN', 'OH', 'MI', 'MO'],
    'Northeast': ['NY', 'VT', 'NH', 'ME', 'MA', 'CT', 'RI', 'PA', 'NJ'],
    'Mid-Atlantic': ['MD', 'DE', 'VA', 'WV'],
    'Southeast': ['FL', 'GA', 'SC', 'NC', 'TN', 'KY', 'AL', 'MS', 'AR', 'LA']
  };

  private terrainTypes = {
    'Desert': ['AZ', 'NV', 'UT', 'NM'],
    'Mountains': ['CO', 'MT', 'WY', 'ID', 'UT', 'WA', 'OR'],
    'Forests': ['OR', 'WA', 'ID', 'MT', 'MN', 'WI', 'MI', 'ME', 'VT', 'NH'],
    'Plains': ['TX', 'NE', 'KS', 'OK', 'ND', 'SD', 'IA'],
    'Coastal': ['CA', 'OR', 'WA', 'FL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'NJ', 'NY', 'CT', 'RI', 'MA', 'NH', 'ME'],
    'Wetlands': ['FL', 'LA', 'MS', 'AL', 'GA'],
    'Urban': ['NY', 'CA', 'IL', 'TX', 'PA', 'OH', 'MI', 'FL']
  };

  /**
   * Process raw drive data into sophisticated journey insights using pattern analysis
   */
  public async processJourneyTimeline(drives: HistoricalDrive[]): Promise<AdvancedJourneyInsights> {
    console.warn('🚀 Processing advanced journey timeline...', { totalDrives: drives.length });

    // First get basic analysis from drive service
    const { segments, statistics, timeline } = driveAnalysisService.analyzeJourneyFromDrives(drives);

    // Analyze journey phases based on geographical patterns
    const journeyPhases = this.analyzeJourneyPhases(segments);

    // Generate advanced milestones with sophisticated logic
    const milestones = this.generateAdvancedMilestones(segments, statistics);

    // Calculate regional coverage
    const uniqueRegions = this.calculateRegionalCoverage(statistics.uniqueStates);

    // Analyze terrain diversity
    const terrainTypes = this.analyzeTerrainDiversity(statistics.uniqueStates);

    // Determine journey complexity and score
    const routeComplexity = this.calculateRouteComplexity(statistics);
    const journeyScore = this.calculateJourneyScore(statistics, milestones, uniqueRegions);

    // Get current position from latest drive
    const currentPosition = segments.length > 0 ? {
      state: segments[segments.length - 1].state,
      coordinates: segments[segments.length - 1].coordinates.end,
      lastUpdate: segments[segments.length - 1].endDate
    } : {
      state: 'Unknown',
      coordinates: { lat: 0, lng: 0 },
      lastUpdate: new Date().toISOString()
    };

    // Estimate weather seasons based on journey timeline
    const weatherSeasons = this.analyzeWeatherSeasons(segments);

    const insights: AdvancedJourneyInsights = {
      totalStatesVisited: statistics.totalStatesVisited,
      totalDrivingDays: statistics.journeyDuration,
      accurateStateCount: statistics.totalStatesVisited, // More accurate from drive analysis
      stateCrossings: statistics.borderCrossings,
      uniqueRegions,
      weatherSeasons,
      terrainTypes,
      journeyPhases,
      currentPosition,
      milestones,
      routeComplexity,
      journeyScore
    };

    console.warn('✅ Advanced journey processing complete:', {
      statesAnalyzed: insights.totalStatesVisited,
      phases: insights.journeyPhases.length,
      milestones: insights.milestones.length,
      complexity: insights.routeComplexity,
      score: insights.journeyScore
    });

    return insights;
  }

  private analyzeJourneyPhases(segments: JourneySegment[]): JourneyPhase[] {
    const phases: JourneyPhase[] = [];
    
    if (segments.length === 0) return phases;

    // Group segments by geographical regions
    let currentPhase: JourneySegment[] = [];
    let currentRegion = '';

    for (const segment of segments) {
      const segmentRegion = this.getRegionForState(segment.stateCode);
      
      if (segmentRegion !== currentRegion) {
        // Start new phase
        if (currentPhase.length > 0) {
          phases.push(this.createPhaseFromSegments(currentPhase, currentRegion));
        }
        currentPhase = [segment];
        currentRegion = segmentRegion;
      } else {
        currentPhase.push(segment);
      }
    }

    // Add final phase
    if (currentPhase.length > 0) {
      phases.push(this.createPhaseFromSegments(currentPhase, currentRegion));
    }

    return phases;
  }

  private createPhaseFromSegments(segments: JourneySegment[], regionName: string): JourneyPhase {
    const states = [...new Set(segments.map(s => s.state))];
    const startDate = segments[0].startDate;
    const endDate = segments[segments.length - 1].endDate;
    
    const terrain = this.getTerrainForRegion(regionName);
    const theme = this.getThemeForRegion(regionName);
    
    return {
      id: `phase-${regionName.toLowerCase().replace(/\s/g, '-')}`,
      name: `${regionName} Exploration`,
      startDate,
      endDate,
      states,
      theme,
      description: `Journey through ${states.join(', ')} in the ${regionName} region`,
      significance: segments.some(s => s.milestoneType === 'national_park') ? 'adventure' : 'exploration',
      terrain,
      weatherConditions: this.getWeatherForRegion(regionName)
    };
  }

  private generateAdvancedMilestones(segments: JourneySegment[], statistics: JourneyStatistics): AdvancedMilestone[] {
    const milestones: AdvancedMilestone[] = [];
    
    // Add journey start milestone
    if (segments.length > 0) {
      milestones.push({
        id: 'journey-start',
        date: segments[0].startDate,
        state: segments[0].state,
        location: segments[0].startLocation,
        type: 'endpoint',
        title: 'Journey Begins',
        description: `Continental USA adventure started in ${segments[0].state}`,
        coordinates: segments[0].coordinates.start,
        significance: 'epic'
      });
    }

    // Add state entry milestones (first 10 states)
    const stateEntries = new Set<string>();
    let stateCount = 0;
    
    for (const segment of segments) {
      if (!stateEntries.has(segment.state) && segment.state !== 'Unknown') {
        stateEntries.add(segment.state);
        stateCount++;
        
        milestones.push({
          id: `state-${segment.stateCode.toLowerCase()}`,
          date: segment.startDate,
          state: segment.state,
          location: segment.endLocation,
          type: 'state_entry',
          title: `${segment.state} - State #${stateCount}`,
          description: `First entry into ${segment.state}`,
          coordinates: segment.coordinates.end,
          significance: stateCount <= 5 ? 'high' : stateCount <= 15 ? 'medium' : 'low',
          metrics: { stateNumber: stateCount }
        });
      }
    }

    // Add national park milestones
    for (const segment of segments) {
      if (segment.milestoneType === 'national_park') {
        milestones.push({
          id: `park-${segment.id}`,
          date: segment.startDate,
          state: segment.state,
          location: segment.endLocation,
          type: 'national_park',
          title: 'National Park Visit',
          description: `Explored natural wonders in ${segment.state}`,
          coordinates: segment.coordinates.end,
          significance: 'epic'
        });
      }
    }

    // Add distance milestones
    let totalMiles = 0;
    const distanceMilestones = [1000, 5000, 10000, 15000, 20000];
    
    for (const segment of segments) {
      totalMiles += segment.distanceMiles;
      
      for (const milestone of distanceMilestones) {
        if (totalMiles >= milestone) {
          const existingMilestone = milestones.find(m => m.metrics?.totalMiles === milestone);
          if (!existingMilestone) {
            milestones.push({
              id: `distance-${milestone}`,
              date: segment.endDate,
              state: segment.state,
              location: segment.endLocation,
              type: 'distance',
              title: `${milestone.toLocaleString()} Miles`,
              description: `Reached ${milestone.toLocaleString()} total miles driven`,
              coordinates: segment.coordinates.end,
              significance: milestone >= 10000 ? 'epic' : milestone >= 5000 ? 'high' : 'medium',
              metrics: { totalMiles: milestone }
            });
          }
        }
      }
    }

    // Add journey end milestone
    if (segments.length > 0) {
      milestones.push({
        id: 'journey-current',
        date: segments[segments.length - 1].endDate,
        state: segments[segments.length - 1].state,
        location: segments[segments.length - 1].endLocation,
        type: 'endpoint',
        title: 'Current Position',
        description: `Currently in ${segments[segments.length - 1].state} after ${statistics.totalStatesVisited} states`,
        coordinates: segments[segments.length - 1].coordinates.end,
        significance: 'high',
        metrics: { 
          totalMiles: statistics.totalMilesDriven,
          stateNumber: statistics.totalStatesVisited 
        }
      });
    }

    // Sort milestones chronologically
    return milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private calculateRegionalCoverage(states: string[]): string[] {
    const stateCodes = states.map(state => {
      // Convert full state names to codes for region matching
      const stateMapping: { [key: string]: string } = {
        'Texas': 'TX', 'New Mexico': 'NM', 'Arizona': 'AZ', 'Utah': 'UT', 'Nevada': 'NV',
        'California': 'CA', 'Oregon': 'OR', 'Washington': 'WA', 'Idaho': 'ID', 'Montana': 'MT',
        'Wyoming': 'WY', 'Colorado': 'CO', 'Nebraska': 'NE', 'Iowa': 'IA', 'South Dakota': 'SD',
        'North Dakota': 'ND', 'Minnesota': 'MN', 'Wisconsin': 'WI', 'Illinois': 'IL', 'Indiana': 'IN',
        'Ohio': 'OH', 'Pennsylvania': 'PA', 'New York': 'NY', 'Vermont': 'VT', 'New Hampshire': 'NH',
        'Maine': 'ME', 'Massachusetts': 'MA', 'Connecticut': 'CT', 'Rhode Island': 'RI',
        'Maryland': 'MD', 'Delaware': 'DE', 'New Jersey': 'NJ', 'Florida': 'FL', 'Georgia': 'GA',
        'South Carolina': 'SC', 'North Carolina': 'NC', 'Virginia': 'VA', 'West Virginia': 'WV',
        'Kentucky': 'KY', 'Tennessee': 'TN', 'Alabama': 'AL', 'Mississippi': 'MS', 'Arkansas': 'AR',
        'Louisiana': 'LA', 'Oklahoma': 'OK', 'Kansas': 'KS', 'Missouri': 'MO', 'Michigan': 'MI'
      };
      return stateMapping[state] || state;
    });

    const visitedRegions = new Set<string>();
    
    for (const [regionName, regionStates] of Object.entries(this.regions)) {
      if (regionStates.some(state => stateCodes.includes(state))) {
        visitedRegions.add(regionName);
      }
    }

    return Array.from(visitedRegions);
  }

  private analyzeTerrainDiversity(states: string[]): string[] {
    const stateCodes = states.map(state => {
      const stateMapping: { [key: string]: string } = {
        'Texas': 'TX', 'New Mexico': 'NM', 'Arizona': 'AZ', 'Utah': 'UT', 'Nevada': 'NV',
        'California': 'CA', 'Oregon': 'OR', 'Washington': 'WA', 'Idaho': 'ID', 'Montana': 'MT',
        'Wyoming': 'WY', 'Colorado': 'CO', 'Nebraska': 'NE', 'Iowa': 'IA', 'South Dakota': 'SD',
        'North Dakota': 'ND', 'Minnesota': 'MN', 'Wisconsin': 'WI', 'Illinois': 'IL', 'Indiana': 'IN',
        'Ohio': 'OH', 'Pennsylvania': 'PA', 'New York': 'NY', 'Vermont': 'VT', 'New Hampshire': 'NH',
        'Maine': 'ME', 'Massachusetts': 'MA', 'Connecticut': 'CT', 'Rhode Island': 'RI',
        'Maryland': 'MD', 'Delaware': 'DE', 'New Jersey': 'NJ', 'Florida': 'FL', 'Georgia': 'GA',
        'South Carolina': 'SC', 'North Carolina': 'NC', 'Virginia': 'VA', 'West Virginia': 'WV',
        'Kentucky': 'KY', 'Tennessee': 'TN', 'Alabama': 'AL', 'Mississippi': 'MS', 'Arkansas': 'AR',
        'Louisiana': 'LA', 'Oklahoma': 'OK', 'Kansas': 'KS', 'Missouri': 'MO', 'Michigan': 'MI'
      };
      return stateMapping[state] || state;
    });

    const terrainTypes = new Set<string>();
    
    for (const [terrain, terrainStates] of Object.entries(this.terrainTypes)) {
      if (terrainStates.some(state => stateCodes.includes(state))) {
        terrainTypes.add(terrain);
      }
    }

    return Array.from(terrainTypes);
  }

  private calculateRouteComplexity(statistics: JourneyStatistics): 'simple' | 'moderate' | 'complex' | 'epic' {
    const factors = {
      states: statistics.totalStatesVisited,
      miles: statistics.totalMilesDriven,
      duration: statistics.journeyDuration,
      parks: statistics.nationalParksVisited.length,
      crossings: statistics.borderCrossings
    };

    const complexityScore = 
      (factors.states * 2) + 
      (factors.miles / 1000) + 
      (factors.duration / 7) + 
      (factors.parks * 3) + 
      (factors.crossings * 1.5);

    if (complexityScore >= 100) return 'epic';
    if (complexityScore >= 60) return 'complex';
    if (complexityScore >= 30) return 'moderate';
    return 'simple';
  }

  private calculateJourneyScore(
    statistics: JourneyStatistics, 
    milestones: AdvancedMilestone[], 
    regions: string[]
  ): number {
    const baseScore = statistics.totalStatesVisited * 10;
    const milesBonus = Math.floor(statistics.totalMilesDriven / 1000) * 5;
    const milestonesBonus = milestones.filter(m => m.significance === 'epic').length * 25;
    const regionsBonus = regions.length * 15;
    const parksBonus = statistics.nationalParksVisited.length * 30;
    
    return Math.min(1000, baseScore + milesBonus + milestonesBonus + regionsBonus + parksBonus);
  }

  private analyzeWeatherSeasons(segments: JourneySegment[]): string[] {
    const seasons = new Set<string>();
    
    for (const segment of segments) {
      const date = new Date(segment.startDate);
      const month = date.getMonth();
      
      if (month >= 2 && month <= 4) seasons.add('Spring');
      else if (month >= 5 && month <= 7) seasons.add('Summer');
      else if (month >= 8 && month <= 10) seasons.add('Fall');
      else seasons.add('Winter');
    }
    
    return Array.from(seasons);
  }

  private getRegionForState(stateCode: string): string {
    for (const [regionName, states] of Object.entries(this.regions)) {
      if (states.includes(stateCode)) {
        return regionName;
      }
    }
    return 'Unknown Region';
  }

  private getTerrainForRegion(regionName: string): string[] {
    const terrainMapping: { [key: string]: string[] } = {
      'Southwest': ['Desert', 'Mountains'],
      'West Coast': ['Coastal', 'Mountains', 'Forests'],
      'Mountain West': ['Mountains', 'Forests', 'Plains'],
      'Great Plains': ['Plains'],
      'Midwest': ['Plains', 'Forests', 'Urban'],
      'Northeast': ['Forests', 'Mountains', 'Coastal', 'Urban'],
      'Mid-Atlantic': ['Coastal', 'Urban', 'Forests'],
      'Southeast': ['Coastal', 'Wetlands', 'Forests']
    };
    
    return terrainMapping[regionName] || ['Mixed'];
  }

  private getThemeForRegion(regionName: string): string {
    const themes: { [key: string]: string } = {
      'Southwest': 'Desert Adventure',
      'West Coast': 'Coastal Exploration',
      'Mountain West': 'Alpine Journey',
      'Great Plains': 'Prairie Crossing',
      'Midwest': 'Heartland Discovery',
      'Northeast': 'Historic Trails',
      'Mid-Atlantic': 'Colonial Heritage',
      'Southeast': 'Southern Landscapes'
    };
    
    return themes[regionName] || 'Regional Exploration';
  }

  private getWeatherForRegion(regionName: string): string[] {
    const weather: { [key: string]: string[] } = {
      'Southwest': ['Hot', 'Dry', 'Clear'],
      'West Coast': ['Mild', 'Coastal', 'Variable'],
      'Mountain West': ['Cold', 'Snow', 'Alpine'],
      'Great Plains': ['Windy', 'Variable', 'Storms'],
      'Midwest': ['Humid', 'Variable', 'Seasonal'],
      'Northeast': ['Cold', 'Snow', 'Variable'],
      'Mid-Atlantic': ['Moderate', 'Humid', 'Seasonal'],
      'Southeast': ['Hot', 'Humid', 'Storms']
    };
    
    return weather[regionName] || ['Variable'];
  }
}

export const journeyTimelineProcessor = new JourneyTimelineProcessor();
