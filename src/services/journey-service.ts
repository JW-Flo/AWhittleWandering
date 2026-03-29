import { Journey, JourneyTotals } from '../types/journey';
import { JourneyCalculator } from '../utils/journey-calculator';

export class JourneyService {
  private journeys: Journey[] = [];
  private totals: JourneyTotals = {
    totalDistance: 0,
    totalDuration: 0,
    averageDistance: 0,
    averageDuration: 0,
    journeyCount: 0
  };

  addJourney(journey: Journey): void {
    this.journeys.push(journey);
    this.totals = JourneyCalculator.updateJourneyTotals(this.totals, journey);
  }

  importJourneys(journeysToImport: Journey[]): void {
    this.journeys = [...this.journeys, ...journeysToImport];
    this.totals = JourneyCalculator.calculateTotals(this.journeys);
  }

  getJourneys(): Journey[] {
    return [...this.journeys];
  }

  getTotals(): JourneyTotals {
    return { ...this.totals };
  }
}