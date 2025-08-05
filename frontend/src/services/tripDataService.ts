// CSV Data Service for loading and analyzing real trip data
import { analyzeRealTripData } from '@/utils/tripDataAnalyzer';

export interface TripDataPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  shiftState: string;
  odometer: number;
  speed: number;
}

export interface DailyDataPoint {
  date: string;
  miles: number;
  statesVisited: string[];
}

export interface TripAnalysisResults {
  tripData: TripDataPoint[];
  statesVisited: string[];
  totalStates: number;
  totalMiles: number;
  totalDays: number;
  averageMilesPerDay: number;
  startDate: string;
  endDate: string;
  startOdometer: number;
  endOdometer: number;
  dailyData: DailyDataPoint[];
}

export class TripDataService {
  private static instance: TripDataService;
  private tripData: TripDataPoint[] = [];
  private analysisResults: TripAnalysisResults | null = null;

  static getInstance(): TripDataService {
    if (!TripDataService.instance) {
      TripDataService.instance = new TripDataService();
    }
    return TripDataService.instance;
  }

  async loadFromFile(file: File): Promise<TripAnalysisResults> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target?.result as string;
          const analysis = await analyzeRealTripData(csvText);
          this.analysisResults = analysis;
          this.tripData = analysis.tripData;
          resolve(analysis);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async loadFromURL(url: string): Promise<TripAnalysisResults> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.statusText}`);
      }
      const csvText = await response.text();
      const analysis = await analyzeRealTripData(csvText);
      this.analysisResults = analysis;
      this.tripData = analysis.tripData;
      return analysis;
    } catch (error) {
      throw new Error(`Failed to load trip data: ${error}`);
    }
  }

  getAnalysis() {
    return this.analysisResults;
  }

  getTripData() {
    return this.tripData;
  }

  getStatesVisited() {
    return this.analysisResults?.statesVisited || [];
  }

  getTripStats() {
    if (!this.analysisResults) return null;
    
    return {
      totalStates: 48, // Goal: all 48 continental states
      visitedStates: this.analysisResults.totalStates,
      remainingStates: 48 - this.analysisResults.totalStates,
      totalMiles: this.analysisResults.totalMiles,
      totalDays: this.analysisResults.totalDays,
      averageMilesPerDay: this.analysisResults.averageMilesPerDay,
      startDate: this.analysisResults.startDate,
      endDate: this.analysisResults.endDate
    };
  }
}
