/**
 * Shared data model for the 48 Continental USA itinerary
 * This serves as the source of truth for all components
 */

export interface ItineraryStop {
  startDate: string;
  endDate?: string;
  location: string;
  state: string;
  personSeen?: string;
  duration: string;
  notes?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Itinerary {
  version: string;
  lastUpdated: string;
  stops: ItineraryStop[];
}

/**
 * Helper functions for itinerary management
 */

/**
 * Get the current or upcoming stop based on the current date
 */
export function getCurrentStop(itinerary: Itinerary, currentDate: Date = new Date()): ItineraryStop | null {
  // Sort stops by date
  const sortedStops = [...itinerary.stops].sort((a, b) => {
    const dateA = new Date(parseDate(a.startDate));
    const dateB = new Date(parseDate(b.startDate));
    return dateA.getTime() - dateB.getTime();
  });

  // Find the current or next upcoming stop
  const currentDateStr = currentDate.toISOString().split('T')[0];
  
  // First try to find a stop that includes today
  for (const stop of sortedStops) {
    const startDate = parseDate(stop.startDate);
    const endDate = stop.endDate ? parseDate(stop.endDate) : startDate;
    
    const startDateStr = new Date(startDate).toISOString().split('T')[0];
    const endDateStr = new Date(endDate).toISOString().split('T')[0];
    
    if (currentDateStr >= startDateStr && currentDateStr <= endDateStr) {
      return stop;
    }
  }
  
  // If no current stop, find the next upcoming one
  for (const stop of sortedStops) {
    const startDate = parseDate(stop.startDate);
    const startDateStr = new Date(startDate).toISOString().split('T')[0];
    
    if (startDateStr > currentDateStr) {
      return stop;
    }
  }
  
  return null;
}

/**
 * Get stops filtered by state
 */
export function getStopsByState(itinerary: Itinerary, state: string): ItineraryStop[] {
  return itinerary.stops.filter(stop => stop.state.toLowerCase() === state.toLowerCase());
}

/**
 * Parse date strings like "6/4" or "6/11–6/12" into full date strings
 * Assumes current year unless specified
 */
export function parseDate(dateStr: string): string {
  // Get current year
  const currentYear = new Date().getFullYear();
  
  // If the date contains a range (e.g., "6/11–6/12"), take the first part
  const firstDate = dateStr.split('–')[0];
  
  // Parse month and day
  const [month, day] = firstDate.split('/').map(num => parseInt(num, 10));
  
  // Format as ISO date string
  return `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * Calculate the trip progress percentage
 */
export function getTripProgress(itinerary: Itinerary, currentDate: Date = new Date()): number {
  const sortedStops = [...itinerary.stops].sort((a, b) => {
    const dateA = new Date(parseDate(a.startDate));
    const dateB = new Date(parseDate(b.startDate));
    return dateA.getTime() - dateB.getTime();
  });
  
  if (sortedStops.length === 0) return 0;
  
  const firstStopDate = new Date(parseDate(sortedStops[0].startDate));
  const lastStopDate = new Date(parseDate(sortedStops[sortedStops.length - 1].startDate));
  const totalDuration = lastStopDate.getTime() - firstStopDate.getTime();
  
  if (totalDuration <= 0) return 0;
  
  const elapsedTime = currentDate.getTime() - firstStopDate.getTime();
  
  if (elapsedTime <= 0) return 0;
  if (elapsedTime >= totalDuration) return 100;
  
  return Math.round((elapsedTime / totalDuration) * 100);
}
