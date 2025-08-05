import { useState, useEffect, useCallback } from 'react';
import { useEnhancedTessieApi } from './useEnhancedTessieApi';
import { JourneyIntelligenceEngine, type JourneyBoundary, type DriveSegment, type ChargeSession, type JourneyInsights } from '@/services/journeyIntelligence';
import { WeatherService, type WeatherData } from '@/services/weatherService';
import { journeyTimeline } from '@/data/journeyData';

interface SmartJourneyStats {
  // Core journey metrics
  totalJourneyMiles: number;
  statesConquered: number;
  currentState: string;
  daysElapsed: number;
  completionPercentage: number;
  
  // Advanced analytics
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
  };
  
  // Real-time data
  currentLocation: { lat: number; lng: number } | null;
  batteryLevel: number;
  isCharging: boolean;
  weatherCallsRemaining: number;
}

interface UseSmartJourneyReturn {
  // Core data
  vehicleData: any;
  journeyStats: SmartJourneyStats;
  insights: JourneyInsights | null;
  
  // Drive and charge data
  driveSegments: DriveSegment[];
  chargeSessions: ChargeSession[];
  
  // Timeline and weather
  currentWeather: WeatherData | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Controls
  refreshData: () => Promise<void>;
  setWeatherApiKey: (key: string) => void;
}

/**
 * State-of-the-art journey tracking hook with intelligent data processing
 */
export function useSmartJourney(tessieApiKey?: string): UseSmartJourneyReturn {
  // Journey boundary definition - A Whittle Wandering journey
  const JOURNEY_BOUNDARY: JourneyBoundary = {
    startDate: new Date('2025-01-01T00:00:00Z'),
    startOdometer: 31000, // Estimated starting odometer (will be refined with real data)
    startLocation: { 
      lat: 27.8006, 
      lng: -97.3964, 
      state: 'Texas' 
    } // Corpus Christi, TX
  };

  // State management
  const [weatherService, setWeatherService] = useState<WeatherService | null>(null);
  const [intelligenceEngine] = useState(() => new JourneyIntelligenceEngine(JOURNEY_BOUNDARY));
  const [driveSegments, setDriveSegments] = useState<DriveSegment[]>([]);
  const [chargeSessions, setChargeSessions] = useState<ChargeSession[]>([]);
  const [insights, setInsights] = useState<JourneyInsights | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Enhanced Tessie API integration
  const {
    vehicleData,
    driveHistory,
    chargeHistory,
    isLoading,
    error,
    refetch: refreshVehicleData
  } = useEnhancedTessieApi(tessieApiKey);

  // Initialize weather service
  useEffect(() => {
    const storedKey = localStorage.getItem('openweather_api_key');
    if (storedKey) {
      setWeatherService(new WeatherService(storedKey));
    }
  }, []);

  // Intelligent data processing when new data arrives
  useEffect(() => {
    if (!vehicleData || !driveHistory || !chargeHistory) return;
    
    const processData = async () => {
      setIsProcessing(true);
      console.warn('🧠 Starting intelligent data processing...');
      
      try {
        // Process drive data with intelligence
        const smartDriveSegments = intelligenceEngine.processDriveData(driveHistory);
        setDriveSegments(smartDriveSegments);
        
        // Process charge data with intelligence
        const smartChargeSessions = intelligenceEngine.processChargeData(chargeHistory);
        setChargeSessions(smartChargeSessions);
        
        // Generate comprehensive insights
        const journeyInsights = intelligenceEngine.generateInsights();
        setInsights(journeyInsights);
        
        console.warn('✅ Intelligent processing complete:', {
          driveSegments: smartDriveSegments.length,
          chargeSessions: smartChargeSessions.length,
          insights: journeyInsights
        });
        
      } catch (error) {
        console.error('❌ Error in intelligent processing:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    processData();
  }, [vehicleData, driveHistory, chargeHistory, intelligenceEngine]);

  // Fetch current weather intelligently
  const fetchCurrentWeather = useCallback(async () => {
    if (!weatherService || !vehicleData) return;
    
    // Cast to any to access real Tessie API structure since VehicleData interface is incomplete
    const tessieData = vehicleData as any;
    const driveState = tessieData.last_state?.drive_state;
    
    if (!driveState?.latitude || !driveState?.longitude) {
      console.warn('No GPS coordinates available for weather fetch');
      return;
    }
    
    try {
      const weather = await weatherService.getCurrentWeather(driveState.latitude, driveState.longitude);
      setCurrentWeather(weather);
      console.warn('🌤️ Current weather fetched:', weather.temperature + '°F');
    } catch (error) {
      console.error('❌ Failed to fetch weather:', error);
    }
  }, [weatherService, vehicleData]);

  // Update weather when location changes
  useEffect(() => {
    fetchCurrentWeather();
  }, [fetchCurrentWeather]);

  // Calculate smart journey statistics
  const calculateSmartStats = useCallback((): SmartJourneyStats => {
    // Cast to any to access real Tessie API structure
    const tessieData = vehicleData as any;
    
    console.warn('📊 Calculating smart stats from vehicle data:', {
      hasVehicleData: !!vehicleData,
      hasLastState: !!tessieData?.last_state,
      hasDriveState: !!tessieData?.last_state?.drive_state,
      hasChargeState: !!tessieData?.last_state?.charge_state,
      hasVehicleState: !!tessieData?.last_state?.vehicle_state
    });
    
    // Get current odometer from the real Tessie structure
    const currentOdometer = tessieData?.last_state?.vehicle_state?.odometer || JOURNEY_BOUNDARY.startOdometer;
    
    // Intelligent mileage calculation
    const totalJourneyMiles = intelligenceEngine.calculateJourneyMileage(currentOdometer);
    
    // Current location from live data
    const driveState = tessieData?.last_state?.drive_state;
    const currentLocation = driveState?.latitude && driveState?.longitude ? {
      lat: driveState.latitude,
      lng: driveState.longitude
    } : null;
    
    // Battery and charging status from real data
    const chargeState = tessieData?.last_state?.charge_state;
    const batteryLevel = chargeState?.battery_level || 0;
    const isCharging = chargeState?.charging_state === 'Charging';
    
    // Journey timeline analytics
    const daysElapsed = Math.ceil(
      (Date.now() - JOURNEY_BOUNDARY.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // States conquered from insights
    const statesConquered = insights?.statesVisited.length || 31; // Fallback to static data
    const completionPercentage = Math.round((statesConquered / 48) * 100);
    
    // Get current state from location
    const currentStateFromStatic = journeyTimeline.find(event => event.current)?.state || 'Connecticut';
    
    const stats = {
      totalJourneyMiles: Math.round(totalJourneyMiles),
      statesConquered,
      currentState: currentStateFromStatic,
      daysElapsed,
      completionPercentage,
      dailyAverages: insights?.dailyAverages || {
        miles: Math.round(totalJourneyMiles / daysElapsed),
        drivingTime: 0,
        charges: 0
      },
      efficiency: insights?.efficiency || {
        milesPerKwh: 0,
        totalEnergyUsed: 0
      },
      patterns: insights?.patterns || {
        preferredChargingTimes: [],
        averageStopDuration: 0
      },
      currentLocation,
      batteryLevel,
      isCharging,
      weatherCallsRemaining: weatherService?.getDailyCallsRemaining() || 0
    };
    
    console.warn('✅ Smart stats calculated:', stats);
    return stats;
  }, [vehicleData, insights, intelligenceEngine, weatherService]);

  // Refresh all data intelligently
  const refreshData = useCallback(async () => {
    console.warn('🔄 Refreshing all journey data...');
    await refreshVehicleData();
    await fetchCurrentWeather();
  }, [refreshVehicleData, fetchCurrentWeather]);

  // Set weather API key
  const setWeatherApiKey = useCallback((key: string) => {
    localStorage.setItem('openweather_api_key', key);
    setWeatherService(new WeatherService(key));
  }, []);

  // Calculate current stats
  const journeyStats = calculateSmartStats();

  return {
    vehicleData,
    journeyStats,
    insights,
    driveSegments,
    chargeSessions,
    currentWeather,
    isLoading: isLoading || isProcessing,
    error,
    refreshData,
    setWeatherApiKey
  };
}