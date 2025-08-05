import { detectStateFromCoordinates } from '@/utils/stateDetection';

export interface JourneyBoundary {
  startDate: Date;
  endDate?: Date;
  startOdometer: number;
  startLocation: { lat: number; lng: number; state: string };
}

export interface DriveSegment {
  id: string;
  startTime: Date;
  endTime: Date;
  startLocation: { lat: number; lng: number; state: string };
  endLocation: { lat: number; lng: number; state: string };
  distance: number;
  duration: number;
  averageSpeed: number;
  maxSpeed: number;
  energyUsed: number;
  isJourneyDrive: boolean;
  stateCrossings: string[];
}

export interface ChargeSession {
  id: string;
  startTime: Date;
  endTime: Date;
  location: { lat: number; lng: number; state: string };
  startBattery: number;
  endBattery: number;
  energyAdded: number;
  chargerType: string;
  chargerPower: number;
  cost?: number;
  isJourneyCharge: boolean;
}

export interface JourneyInsights {
  totalJourneyMiles: number;
  statesVisited: string[];
  dailyAverages: {
    miles: number;
    drivingTime: number;
    charges: number;
  };
  efficiency: {
    milesPerKwh: number;
    totalEnergyUsed: number;
  };
  patterns: {
    preferredChargingTimes: string[];
    averageStopDuration: number;
    longestDriveSegment: DriveSegment;
  };
}

/**
 * Advanced Journey Data Intelligence Engine
 * Provides contextual analysis and intelligent filtering of vehicle data
 */
export class JourneyIntelligenceEngine {
  private journeyBoundary: JourneyBoundary;
  private driveSegments: DriveSegment[] = [];
  private chargeSessions: ChargeSession[] = [];
  
  constructor(journeyStart: JourneyBoundary) {
    this.journeyBoundary = journeyStart;
    console.warn('🧠 Journey Intelligence Engine initialized:', journeyStart);
  }

  /**
   * Intelligently filters and processes raw Tessie drive data
   */
  processDriveData(rawDriveData: any[]): DriveSegment[] {
    console.warn('🚗 Processing drive data with intelligence...');
    
    const processedSegments = rawDriveData
      .filter(drive => this.isWithinJourneyTimeframe(new Date(drive.started_at)))
      .map(drive => this.createDriveSegment(drive))
      .filter(segment => segment.isJourneyDrive);

    this.driveSegments = processedSegments;
    console.warn(`✅ Processed ${processedSegments.length} journey drive segments`);
    
    return processedSegments;
  }

  /**
   * Intelligently processes charge session data
   */
  processChargeData(rawChargeData: any[]): ChargeSession[] {
    console.warn('⚡ Processing charge data with intelligence...');
    
    const processedSessions = rawChargeData
      .filter(charge => this.isWithinJourneyTimeframe(new Date(charge.started_at)))
      .map(charge => this.createChargeSession(charge))
      .filter(session => session.isJourneyCharge);

    this.chargeSessions = processedSessions;
    console.warn(`✅ Processed ${processedSessions.length} journey charge sessions`);
    
    return processedSessions;
  }

  /**
   * Calculates intelligent journey-specific mileage
   */
  calculateJourneyMileage(currentOdometer: number): number {
    const journeyMiles = currentOdometer - this.journeyBoundary.startOdometer;
    console.warn(`📊 Journey mileage calculation:`, {
      current: currentOdometer,
      start: this.journeyBoundary.startOdometer,
      journeyMiles
    });
    return Math.max(0, journeyMiles);
  }

  /**
   * Generates comprehensive journey insights
   */
  generateInsights(): JourneyInsights {
    const totalJourneyMiles = this.driveSegments.reduce((sum, segment) => sum + segment.distance, 0);
    const statesVisited = this.getUniqueStatesVisited();
    const totalEnergyUsed = this.chargeSessions.reduce((sum, session) => sum + session.energyAdded, 0);
    
    const insights: JourneyInsights = {
      totalJourneyMiles,
      statesVisited,
      dailyAverages: this.calculateDailyAverages(),
      efficiency: {
        milesPerKwh: totalJourneyMiles / (totalEnergyUsed || 1),
        totalEnergyUsed
      },
      patterns: this.analyzePatterns()
    };

    console.warn('🔍 Generated journey insights:', insights);
    return insights;
  }

  /**
   * Detects state boundary crossings with intelligence
   */
  detectStateCrossings(driveSegment: DriveSegment): string[] {
    const crossings: string[] = [];
    
    // If start and end states are different, we crossed at least one boundary
    if (driveSegment.startLocation.state !== driveSegment.endLocation.state) {
      crossings.push(driveSegment.endLocation.state);
    }
    
    // TODO: Add intermediate waypoint analysis for complex routes
    return crossings;
  }

  /**
   * Creates an intelligent drive segment from raw data
   */
  private createDriveSegment(rawDrive: any): DriveSegment {
    const startLocation = this.getLocationWithState(rawDrive.start_location);
    const endLocation = this.getLocationWithState(rawDrive.end_location);
    
    const segment: DriveSegment = {
      id: `drive_${rawDrive.id}`,
      startTime: new Date(rawDrive.started_at),
      endTime: new Date(rawDrive.ended_at),
      startLocation,
      endLocation,
      distance: rawDrive.distance_mi || 0,
      duration: rawDrive.duration_min || 0,
      averageSpeed: rawDrive.average_speed_mph || 0,
      maxSpeed: rawDrive.max_speed_mph || 0,
      energyUsed: rawDrive.energy_used_kwh || 0,
      isJourneyDrive: this.isJourneyRelatedDrive(startLocation, endLocation, rawDrive),
      stateCrossings: []
    };

    segment.stateCrossings = this.detectStateCrossings(segment);
    return segment;
  }

  /**
   * Creates an intelligent charge session from raw data
   */
  private createChargeSession(rawCharge: any): ChargeSession {
    const location = this.getLocationWithState(rawCharge.location);
    
    return {
      id: `charge_${rawCharge.id}`,
      startTime: new Date(rawCharge.started_at),
      endTime: new Date(rawCharge.ended_at),
      location,
      startBattery: rawCharge.start_battery_level || 0,
      endBattery: rawCharge.end_battery_level || 0,
      energyAdded: rawCharge.energy_added_kwh || 0,
      chargerType: rawCharge.charger_type || 'Unknown',
      chargerPower: rawCharge.charger_power_kw || 0,
      cost: rawCharge.cost_usd,
      isJourneyCharge: this.isJourneyRelatedCharge(location, rawCharge)
    };
  }

  /**
   * Determines if a location is within the journey context
   */
  private isWithinJourneyTimeframe(timestamp: Date): boolean {
    const isAfterStart = timestamp >= this.journeyBoundary.startDate;
    const isBeforeEnd = !this.journeyBoundary.endDate || timestamp <= this.journeyBoundary.endDate;
    return isAfterStart && isBeforeEnd;
  }

  /**
   * Intelligent determination of journey-related drives
   */
  private isJourneyRelatedDrive(startLoc: any, endLoc: any, rawDrive: any): boolean {
    // Filter out local/daily drives that aren't part of the journey
    const distance = rawDrive.distance_mi || 0;
    const duration = rawDrive.duration_min || 0;
    
    // Journey drives are typically longer distance or cross state boundaries
    const isLongDistance = distance > 50; // 50+ miles likely journey
    const crossesStates = startLoc.state !== endLoc.state;
    const isSignificantDuration = duration > 60; // 1+ hour drives
    
    return isLongDistance || crossesStates || isSignificantDuration;
  }

  /**
   * Intelligent determination of journey-related charges
   */
  private isJourneyRelatedCharge(location: any, rawCharge: any): boolean {
    // Journey charges are typically away from home base
    const energyAdded = rawCharge.energy_added_kwh || 0;
    const duration = rawCharge.duration_min || 0;
    
    // Significant charges are likely journey-related
    return energyAdded > 10 || duration > 30; // 10+ kWh or 30+ min sessions
  }

  /**
   * Gets location with intelligent state detection
   */
  private getLocationWithState(location: any): { lat: number; lng: number; state: string } {
    const lat = location?.latitude || 0;
    const lng = location?.longitude || 0;
    const detectedState = detectStateFromCoordinates(lat, lng);
    
    return {
      lat,
      lng,
      state: detectedState?.name || 'Unknown'
    };
  }

  /**
   * Gets unique states visited during the journey
   */
  private getUniqueStatesVisited(): string[] {
    const states = new Set<string>();
    
    // Add states from drive segments
    this.driveSegments.forEach(segment => {
      states.add(segment.startLocation.state);
      states.add(segment.endLocation.state);
      segment.stateCrossings.forEach(state => states.add(state));
    });
    
    // Add states from charge sessions
    this.chargeSessions.forEach(session => {
      states.add(session.location.state);
    });
    
    return Array.from(states).filter(state => state !== 'Unknown').sort();
  }

  /**
   * Calculates daily averages with intelligence
   */
  private calculateDailyAverages() {
    const journeyDays = Math.max(1, Math.ceil(
      (Date.now() - this.journeyBoundary.startDate.getTime()) / (24 * 60 * 60 * 1000)
    ));
    
    const totalMiles = this.driveSegments.reduce((sum, s) => sum + s.distance, 0);
    const totalDrivingTime = this.driveSegments.reduce((sum, s) => sum + s.duration, 0);
    const totalCharges = this.chargeSessions.length;
    
    return {
      miles: Math.round(totalMiles / journeyDays),
      drivingTime: Math.round(totalDrivingTime / journeyDays),
      charges: Math.round((totalCharges / journeyDays) * 10) / 10
    };
  }

  /**
   * Analyzes patterns in the journey data
   */
  private analyzePatterns() {
    const chargingHours = this.chargeSessions.map(session => 
      session.startTime.getHours()
    );
    
    const preferredChargingTimes = this.getMostFrequentHours(chargingHours);
    const stopDurations = this.chargeSessions.map(session => 
      (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
    );
    const averageStopDuration = stopDurations.length > 0 
      ? stopDurations.reduce((sum, d) => sum + d, 0) / stopDurations.length 
      : 0;
    
    const longestDriveSegment = this.driveSegments.reduce((longest, segment) => 
      segment.distance > (longest?.distance || 0) ? segment : longest
    );
    
    return {
      preferredChargingTimes,
      averageStopDuration: Math.round(averageStopDuration),
      longestDriveSegment
    };
  }

  /**
   * Finds most frequent charging hours
   */
  private getMostFrequentHours(hours: number[]): string[] {
    const hourCounts = hours.reduce((counts, hour) => {
      counts[hour] = (counts[hour] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);
    
    const maxCount = Math.max(...Object.values(hourCounts));
    return Object.entries(hourCounts)
      .filter(([_, count]) => count === maxCount)
      .map(([hour, _]) => `${hour}:00`);
  }

  // Getters for external access
  get driveHistory(): DriveSegment[] { return this.driveSegments; }
  get chargeHistory(): ChargeSession[] { return this.chargeSessions; }
  get boundary(): JourneyBoundary { return this.journeyBoundary; }
}