import { useState, useEffect } from 'react';

export interface TrackingEvent {
  id: string;
  type: 'charging' | 'overnight' | 'scenic_stop' | 'driving' | 'state_entry';
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    address?: string;
    state?: string;
  };
  duration?: number; // in minutes
  metadata?: {
    chargerType?: string;
    accommodationType?: string;
    stopReason?: string;
    stateCount?: number;
  };
}

export interface LocationData {
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: Date;
  heading?: number;
}

class SmartJourneyTracker {
  private lastLocation: LocationData | null = null;
  private stationaryStart: Date | null = null;
  private events: TrackingEvent[] = [];
  private visitedStates = new Set<string>();

  // Tesla Supercharger locations (sample - in production, use comprehensive database)
  private superchargerLocations = [
    { lat: 41.3851, lng: -72.0301, name: "Wallingford, CT" },
    { lat: 40.7589, lng: -73.9851, name: "Manhattan, NY" },
    // Add more locations as needed
  ];

  constructor(private onEventDetected: (event: TrackingEvent) => void) {}

  updateLocation(location: LocationData) {
    const currentTime = new Date();
    
    if (this.lastLocation) {
      // Detect state changes
      this.detectStateChange(location);
      
      // Detect stop types
      this.detectStops(location, currentTime);
      
      // Detect driving segments
      this.detectDriving(location);
    }

    this.lastLocation = location;
  }

  private async detectStateChange(location: LocationData) {
    // In production, use reverse geocoding API to get state
    const state = await this.getStateFromCoordinates(location.latitude, location.longitude);
    
    if (state && !this.visitedStates.has(state)) {
      this.visitedStates.add(state);
      
      const event: TrackingEvent = {
        id: `state-${Date.now()}`,
        type: 'state_entry',
        timestamp: new Date(),
        location: {
          lat: location.latitude,
          lng: location.longitude,
          state
        },
        metadata: {
          stateCount: this.visitedStates.size
        }
      };
      
      this.onEventDetected(event);
    }
  }

  private detectStops(location: LocationData, currentTime: Date) {
    const isStationary = location.speed < 5; // Less than 5 mph considered stationary
    
    if (isStationary && !this.stationaryStart) {
      // Just stopped
      this.stationaryStart = currentTime;
    } else if (!isStationary && this.stationaryStart) {
      // Just started moving again
      const stationaryDuration = (currentTime.getTime() - this.stationaryStart.getTime()) / (1000 * 60); // minutes
      
      this.classifyStop(location, this.stationaryStart, stationaryDuration);
      this.stationaryStart = null;
    }
  }

  private classifyStop(location: LocationData, startTime: Date, duration: number) {
    const hour = startTime.getHours();
    const isNighttime = hour >= 20 || hour <= 7;
    const nearSupercharger = this.isNearSupercharger(location.latitude, location.longitude);

    let eventType: TrackingEvent['type'];
    let metadata: TrackingEvent['metadata'] = {};

    if (duration >= 360 && isNighttime) { // 6+ hours at night
      eventType = 'overnight';
      metadata.accommodationType = this.guessAccommodationType(duration);
    } else if (duration >= 20 && duration <= 90 && nearSupercharger) { // 20-90 min near supercharger
      eventType = 'charging';
      metadata.chargerType = 'Tesla Supercharger';
    } else if (duration >= 30 && duration <= 180) { // 30min-3hr
      eventType = 'scenic_stop';
      metadata.stopReason = this.guessStopReason(location, duration);
    } else {
      return; // Don't track very short stops
    }

    const event: TrackingEvent = {
      id: `stop-${Date.now()}`,
      type: eventType,
      timestamp: startTime,
      location: {
        lat: location.latitude,
        lng: location.longitude
      },
      duration,
      metadata
    };

    this.onEventDetected(event);
  }

  private detectDriving(location: LocationData) {
    if (location.speed > 25) { // Driving at highway speeds
      // Could track driving segments, total miles, etc.
    }
  }

  private isNearSupercharger(lat: number, lng: number): boolean {
    const PROXIMITY_THRESHOLD = 0.01; // ~1km
    
    return this.superchargerLocations.some(charger => {
      const distance = Math.sqrt(
        Math.pow(lat - charger.lat, 2) + Math.pow(lng - charger.lng, 2)
      );
      return distance < PROXIMITY_THRESHOLD;
    });
  }

  private guessAccommodationType(duration: number): string {
    if (duration > 600) return 'Extended stay'; // 10+ hours
    if (duration > 450) return 'Hotel/Motel'; // 7.5+ hours
    return 'Camping/Short stay'; // 6-7.5 hours
  }

  private guessStopReason(location: LocationData, duration: number): string {
    // In production, could use nearby points of interest
    if (duration > 120) return 'Sightseeing/Hiking';
    if (duration > 60) return 'Meal/Rest stop';
    return 'Quick stop';
  }

  private async getStateFromCoordinates(lat: number, lng: number): Promise<string | null> {
    // In production, use reverse geocoding API
    // For now, return null - would implement with Google Maps or similar
    return null;
  }

  getEvents(): TrackingEvent[] {
    return [...this.events];
  }

  getVisitedStates(): string[] {
    return Array.from(this.visitedStates);
  }
}

// React Hook for Smart Tracking
export const useSmartTracking = () => {
  const [events, setEvents] = useState<TrackingEvent[]>(() => {
    // Initialize with some sample tracking events for demo
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 'sample-drive-1',
        type: 'driving',
        timestamp: twoHoursAgo,
        location: {
          lat: 41.1865,
          lng: -73.1532,
          address: 'Greenwich, CT',
          state: 'Connecticut'
        },
        duration: 120, // 2 hours in minutes
      },
      {
        id: 'sample-charge-1',
        type: 'charging',
        timestamp: oneHourAgo,
        location: {
          lat: 41.2033,
          lng: -73.1234,
          address: 'Tesla Supercharger - Stamford, CT',
          state: 'Connecticut'
        },
        duration: 45, // 45 minutes
        metadata: {
          chargerType: 'Supercharger'
        }
      },
      {
        id: 'sample-overnight-1',
        type: 'overnight',
        timestamp: threeDaysAgo,
        location: {
          lat: 40.7589,
          lng: -73.9851,
          address: 'Hotel in Manhattan, NY',
          state: 'New York'
        },
        duration: 720, // 12 hours
        metadata: {
          accommodationType: 'Hotel'
        }
      },
      {
        id: 'sample-drive-2',
        type: 'driving',
        timestamp: oneWeekAgo,
        location: {
          lat: 42.3601,
          lng: -71.0589,
          address: 'Boston, MA',
          state: 'Massachusetts'
        },
        duration: 180, // 3 hours
      },
      {
        id: 'sample-state-entry-1',
        type: 'state_entry',
        timestamp: oneWeekAgo,
        location: {
          lat: 42.3601,
          lng: -71.0589,
          address: 'Massachusetts State Line',
          state: 'Massachusetts'
        },
        metadata: {
          stateCount: 17
        }
      }
    ];
  });
  
  const [tracker] = useState(() => new SmartJourneyTracker((event) => {
    setEvents(prev => [...prev, event]);
  }));

  useEffect(() => {
    // In production, would get location updates from GPS/Tesla API
    // For demo, simulate location updates
    const interval = setInterval(() => {
      // Simulate location update (replace with real Tesla telemetry)
      const mockLocation: LocationData = {
        latitude: 41.1865 + (Math.random() - 0.5) * 0.01,
        longitude: -73.1532 + (Math.random() - 0.5) * 0.01,
        speed: Math.random() * 70,
        timestamp: new Date(),
        heading: Math.random() * 360
      };
      
      tracker.updateLocation(mockLocation);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [tracker]);

  const addManualEvent = (event: Omit<TrackingEvent, 'id'>) => {
    const fullEvent: TrackingEvent = {
      ...event,
      id: `manual-${Date.now()}`
    };
    setEvents(prev => [...prev, fullEvent]);
  };

  return {
    events,
    addManualEvent,
    visitedStates: tracker.getVisitedStates()
  };
};

export default SmartJourneyTracker;
