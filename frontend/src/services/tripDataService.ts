// CSV Data Service for loading and analyzing real trip data
import { analyzeRealTripData } from '@/utils/tripDataAnalyzer';

export class TripDataService {
  private static instance: TripDataService;
  private tripData: any[] = [];
  private analysisResults: any = null;

  static getInstance(): TripDataService {
    if (!TripDataService.instance) {
      TripDataService.instance = new TripDataService();
    }
    return TripDataService.instance;
  }

  async loadFromFile(file: File): Promise<any> {
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

  async loadFromURL(url: string): Promise<any> {
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
