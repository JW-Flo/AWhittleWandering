/**
 * Dynamic Place Intelligence Service
 * 
 * Identifies places and infers activities WITHOUT hardcoded categories.
 * 
 * Flow:
 * 1. Reverse geocode GPS → get place name + raw data
 * 2. If place type unclear, web search the business name
 * 3. Use AI/LLM to classify place and infer likely activities
 * 4. Learn from user corrections over time
 * 
 * Rate Limit Aware:
 * - Checks provider availability before making requests
 * - Tracks all API calls for quota management
 * - Skips exhausted providers to reduce latency
 */

import { logger } from '../utils/log';
import { ApiRateLimitTracker } from './apiRateLimitTracker';

interface PlaceIntelligenceEnv {
  AI?: any; // Cloudflare AI binding
  MAPBOX_API_TOKEN?: string;
  // Web search providers (fallback chain)
  SERPER_API_KEY?: string;  // serper.dev - 2,500 free/month
  BRAVE_API_KEY?: string;   // brave.com/search/api - 2,000 free/month  
  TAVILY_API_KEY?: string;  // tavily.com - 1,000 free/month (AI-optimized)
  TESLA_DB?: D1Database;
}

interface SearchResult {
  type: string | null;
  description: string | null;
  hours: string | null;
  raw: any;
  provider: string;
}

export interface PlaceInfo {
  // Core location
  latitude: number;
  longitude: number;
  
  // Reverse geocode results
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  
  // Dynamic classification (AI-generated)
  place_type: string | null;        // e.g., "golf_course", "steakhouse", "car_dealership"
  place_description: string | null; // e.g., "18-hole championship golf course with driving range"
  business_hours: string | null;    // If available from search
  
  // Raw data for debugging
  raw_geocode?: any;
  raw_search?: any;
  
  // Confidence and source
  confidence: number;
  source: 'geocode' | 'search' | 'ai' | 'user_defined';
}

export interface ActivityInference {
  activity: string;           // e.g., "Played a round of golf"
  confidence: number;
  reasoning: string;          // AI's reasoning for the inference
  duration_minutes: number;
  alternative_activities?: string[]; // Other possible activities
}

export interface StopAnalysis {
  place: PlaceInfo;
  inferred_activity: ActivityInference | null;
  is_overnight: boolean;
  is_likely_home: boolean;
  is_likely_work: boolean;
}

// In-memory cache
const placeCache = new Map<string, PlaceInfo>();
const activityCache = new Map<string, ActivityInference>();

export class DynamicPlaceIntelligence {
  private env: PlaceIntelligenceEnv;
  private rateLimitTracker: ApiRateLimitTracker | null = null;

  constructor(env: PlaceIntelligenceEnv) {
    this.env = env;
    // Initialize rate limit tracker if DB is available
    if (env.TESLA_DB) {
      this.rateLimitTracker = new ApiRateLimitTracker(env.TESLA_DB);
    }
  }

  /**
   * Get the rate limit tracker for external access
   */
  getRateLimitTracker(): ApiRateLimitTracker | null {
    return this.rateLimitTracker;
  }

  /**
   * Main entry point: Analyze a stop location
   */
  async analyzeStop(
    lat: number, 
    lng: number, 
    durationMinutes: number,
    arrivedAt: Date,
    departedAt?: Date
  ): Promise<StopAnalysis> {
    // Step 1: Get place info (geocode + search if needed)
    const place = await this.identifyPlace(lat, lng);
    
    // Step 2: Infer activity based on place + duration + time
    const activity = await this.inferActivity(place, durationMinutes, arrivedAt, departedAt);
    
    // Step 3: Check for special location types
    const isOvernight = this.isOvernightStay(arrivedAt, departedAt);
    const isLikelyHome = await this.checkIfHome(lat, lng);
    const isLikelyWork = await this.checkIfWork(lat, lng, arrivedAt);

    return {
      place,
      inferred_activity: activity,
      is_overnight: isOvernight,
      is_likely_home: isLikelyHome,
      is_likely_work: isLikelyWork,
    };
  }

  /**
   * Step 1: Identify the place at given coordinates
   */
  async identifyPlace(lat: number, lng: number): Promise<PlaceInfo> {
    const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    
    if (placeCache.has(cacheKey)) {
      return placeCache.get(cacheKey)!;
    }

    // Start with reverse geocoding
    let place = await this.reverseGeocode(lat, lng);
    
    // If we got a place name but don't understand what it is, search for more info
    if (place.name && !place.place_type) {
      place = await this.enrichWithSearch(place);
    }
    
    // If still unclear, use AI to classify based on available info
    if (!place.place_type && this.env.AI) {
      place = await this.classifyWithAI(place);
    }

    placeCache.set(cacheKey, place);
    return place;
  }

  /**
   * Reverse geocode using OpenStreetMap Nominatim
   * Rate limit aware: OSM has strict limits (1 req/sec, 1000/day)
   */
  private async reverseGeocode(lat: number, lng: number): Promise<PlaceInfo> {
    // Check Nominatim rate limits (very strict - 1 per second)
    if (this.rateLimitTracker) {
      const isAvailable = await this.rateLimitTracker.isProviderAvailable('nominatim');
      if (!isAvailable) {
        logger.warn('Nominatim rate limited, returning empty place');
        return this.createEmptyPlace(lat, lng);
      }
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&extratags=1&namedetails=1&zoom=18`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AWhittleWandering-Tesla-Tracker/1.0',
        },
      });
      
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        if (this.rateLimitTracker) {
          await this.rateLimitTracker.recordRequest('nominatim', false, latencyMs, response.status.toString());
        }
        throw new Error(`Geocode failed: ${response.status}`);
      }

      // Record successful request
      if (this.rateLimitTracker) {
        await this.rateLimitTracker.recordRequest('nominatim', true, latencyMs);
      }

      const data = await response.json() as any;
      const address = data.address || {};
      const extratags = data.extratags || {};
      
      // Extract place type from OSM data if available
      let placeType: string | null = null;
      let placeDescription: string | null = null;
      
      // OSM provides type/class info
      if (data.type && data.class) {
        placeType = `${data.class}:${data.type}`;
      }
      
      // Check extratags for more info
      if (extratags.description) {
        placeDescription = extratags.description;
      }
      if (extratags.cuisine) {
        placeDescription = `${extratags.cuisine} restaurant`;
        placeType = 'restaurant';
      }
      if (extratags.sport === 'golf') {
        placeType = 'golf_course';
      }

      return {
        latitude: lat,
        longitude: lng,
        name: data.name || address.amenity || address.shop || address.leisure || null,
        address: this.formatAddress(address),
        city: address.city || address.town || address.village || null,
        state: address.state || null,
        country: address.country || null,
        place_type: placeType,
        place_description: placeDescription,
        business_hours: extratags.opening_hours || null,
        raw_geocode: data,
        confidence: data.name ? 0.7 : 0.4,
        source: 'geocode',
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      if (this.rateLimitTracker) {
        await this.rateLimitTracker.recordRequest('nominatim', false, latencyMs, 'ERROR');
      }
      logger.warn('Reverse geocode failed', { error, lat, lng });
      return this.createEmptyPlace(lat, lng);
    }
  }

  /**
   * Enrich place info with web search using fallback chain:
   * Serper (2,500/mo) → Brave (2,000/mo) → Tavily (1,000/mo) → AI
   * 
   * Rate limit aware: skips providers at capacity to reduce latency
   */
  private async enrichWithSearch(place: PlaceInfo): Promise<PlaceInfo> {
    if (!place.name) return place;

    // Build search query
    const searchQuery = [
      place.name,
      place.city,
      place.state,
      'what is',
    ].filter(Boolean).join(' ');

    // Try each provider in order until one succeeds
    const providers = [
      { name: 'serper', fn: () => this.searchWithSerper(searchQuery), key: this.env.SERPER_API_KEY },
      { name: 'brave', fn: () => this.searchWithBrave(searchQuery), key: this.env.BRAVE_API_KEY },
      { name: 'tavily', fn: () => this.searchWithTavily(searchQuery), key: this.env.TAVILY_API_KEY },
    ];

    try {
      for (const provider of providers) {
        if (!provider.key) continue;
        
        // Check rate limits before making request (skip if at capacity)
        if (this.rateLimitTracker) {
          const isAvailable = await this.rateLimitTracker.isProviderAvailable(provider.name);
          if (!isAvailable) {
            logger.info(`Skipping ${provider.name} - at rate limit capacity`);
            continue;
          }
        }
        
        const startTime = Date.now();
        try {
          const searchResult = await provider.fn();
          const latencyMs = Date.now() - startTime;
          
          // Record successful request
          if (this.rateLimitTracker) {
            await this.rateLimitTracker.recordRequest(provider.name, true, latencyMs);
          }
          
          if (searchResult) {
            logger.info(`Place search succeeded with ${provider.name}`, { 
              place: place.name, 
              latencyMs 
            });
            return {
              ...place,
              place_type: searchResult.type || place.place_type,
              place_description: searchResult.description || place.place_description,
              business_hours: searchResult.hours || place.business_hours,
              raw_search: { ...searchResult.raw, provider: searchResult.provider },
              confidence: 0.85,
              source: 'search',
            };
          }
        } catch (providerError: any) {
          const latencyMs = Date.now() - startTime;
          const errorCode = providerError?.status?.toString() || 'ERROR';
          
          // Record failed request
          if (this.rateLimitTracker) {
            await this.rateLimitTracker.recordRequest(provider.name, false, latencyMs, errorCode);
          }
          
          logger.warn(`${provider.name} search failed, trying next provider`, { 
            error: providerError,
            latencyMs,
            errorCode,
          });
          continue;
        }
      }

      // Fallback: Use Cloudflare AI to search and understand
      if (this.env.AI) {
        const startTime = Date.now();
        try {
          const aiResult = await this.searchWithAI(searchQuery, place);
          const latencyMs = Date.now() - startTime;
          
          if (this.rateLimitTracker) {
            await this.rateLimitTracker.recordRequest('cloudflare_ai', true, latencyMs);
          }
          
          if (aiResult) {
            return {
              ...place,
              ...aiResult,
              confidence: 0.8,
              source: 'ai',
            };
          }
        } catch (aiError) {
          const latencyMs = Date.now() - startTime;
          if (this.rateLimitTracker) {
            await this.rateLimitTracker.recordRequest('cloudflare_ai', false, latencyMs, 'AI_ERROR');
          }
        }
      }
    } catch (error) {
      logger.warn('Place search failed', { error, name: place.name });
    }

    return place;
  }

  /**
   * Search using Serper API (Google Search)
   * Free tier: 2,500 queries/month
   * Docs: https://serper.dev/
   */
  private async searchWithSerper(query: string): Promise<SearchResult | null> {
    if (!this.env.SERPER_API_KEY) return null;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': this.env.SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data = await response.json() as any;
    
    // Extract knowledge graph if available
    const kg = data.knowledgeGraph;
    if (kg) {
      return {
        type: kg.type || null,
        description: kg.description || null,
        hours: kg.hours || null,
        raw: data,
        provider: 'serper',
      };
    }

    // Try to extract from organic results
    const organic = data.organic?.[0];
    if (organic) {
      return {
        type: null,
        description: organic.snippet || null,
        hours: null,
        raw: data,
        provider: 'serper',
      };
    }

    return null;
  }

  /**
   * Search using Brave Search API
   * Free tier: 2,000 queries/month
   * Docs: https://brave.com/search/api/
   */
  private async searchWithBrave(query: string): Promise<SearchResult | null> {
    if (!this.env.BRAVE_API_KEY) return null;

    const params = new URLSearchParams({
      q: query,
      count: '5',
      result_filter: 'web',
    });

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.env.BRAVE_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }

    const data = await response.json() as any;

    // Extract from infobox (knowledge panel equivalent)
    const infobox = data.infobox;
    if (infobox) {
      return {
        type: infobox.type || infobox.subtype || null,
        description: infobox.description || null,
        hours: null,
        raw: data,
        provider: 'brave',
      };
    }

    // Extract from web results
    const webResult = data.web?.results?.[0];
    if (webResult) {
      return {
        type: null,
        description: webResult.description || null,
        hours: null,
        raw: data,
        provider: 'brave',
      };
    }

    return null;
  }

  /**
   * Search using Tavily API (AI-optimized search)
   * Free tier: 1,000 queries/month
   * Docs: https://tavily.com/
   */
  private async searchWithTavily(query: string): Promise<SearchResult | null> {
    if (!this.env.TAVILY_API_KEY) return null;

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.env.TAVILY_API_KEY,
        query: query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json() as any;

    // Tavily provides a direct answer which is great for AI use cases
    if (data.answer) {
      // Try to extract type from the answer
      const typeMatch = data.answer.match(/\b(golf course|restaurant|hotel|cafe|bar|museum|park|hospital|airport|stadium|gym|spa|salon|mall|store|shop|dealership|garage|mechanic|bank|pharmacy|school|church|theater|cinema)\b/i);
      
      return {
        type: typeMatch ? typeMatch[1].toLowerCase().replace(/\s+/g, '_') : null,
        description: data.answer,
        hours: null,
        raw: data,
        provider: 'tavily',
      };
    }

    // Fallback to first result
    const result = data.results?.[0];
    if (result) {
      return {
        type: null,
        description: result.content || null,
        hours: null,
        raw: data,
        provider: 'tavily',
      };
    }

    return null;
  }

  /**
   * Use Cloudflare AI to search and understand a place
   */
  private async searchWithAI(query: string, place: PlaceInfo): Promise<Partial<PlaceInfo> | null> {
    if (!this.env.AI) return null;

    try {
      const prompt = `You are analyzing a location. Given the following information, determine what type of place this is and what activities typically happen there.

Place name: ${place.name}
Address: ${place.address || 'Unknown'}
City: ${place.city || 'Unknown'}
State: ${place.state || 'Unknown'}
Raw geocode type: ${place.place_type || 'Unknown'}

Respond in JSON format:
{
  "place_type": "short_identifier like 'golf_course', 'steakhouse', 'car_dealership'",
  "place_description": "brief description of what this place is",
  "typical_activities": ["list", "of", "activities"],
  "typical_duration_minutes": {"min": 30, "max": 120}
}`;

      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
      });

      const text = response.response || '';
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          place_type: parsed.place_type,
          place_description: parsed.place_description,
        };
      }
    } catch (error) {
      logger.warn('AI place classification failed', { error });
    }

    return null;
  }

  /**
   * Classify place using AI when other methods fail
   */
  private async classifyWithAI(place: PlaceInfo): Promise<PlaceInfo> {
    if (!this.env.AI || !place.name) return place;

    try {
      const prompt = `What type of business or place is "${place.name}" in ${place.city || 'Unknown city'}, ${place.state || 'Unknown state'}? 
      
Respond with just a short identifier like: golf_course, restaurant, hotel, gas_station, shopping_mall, hospital, park, etc.`;

      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
      });

      const text = (response.response || '').toLowerCase().trim();
      
      // Extract the type from the response
      const typeMatch = text.match(/\b(golf_course|restaurant|hotel|gas_station|shopping|hospital|park|gym|cafe|bar|airport|museum|beach|supermarket|bank|pharmacy|school|church|stadium|theater|spa|salon|dealership|mechanic|store|office|warehouse|factory)\b/);
      
      if (typeMatch) {
        return {
          ...place,
          place_type: typeMatch[1],
          confidence: 0.6,
          source: 'ai',
        };
      }
    } catch (error) {
      logger.warn('AI classification failed', { error });
    }

    return place;
  }

  /**
   * Step 2: Infer activity based on place, duration, and time
   */
  async inferActivity(
    place: PlaceInfo,
    durationMinutes: number,
    arrivedAt: Date,
    departedAt?: Date
  ): Promise<ActivityInference | null> {
    // Skip very short stops
    if (durationMinutes < 5) return null;

    // Use AI to infer activity dynamically
    if (this.env.AI) {
      return this.inferActivityWithAI(place, durationMinutes, arrivedAt, departedAt);
    }

    // Fallback: Basic inference without AI
    return this.inferActivityBasic(place, durationMinutes);
  }

  /**
   * Use AI to infer what activity occurred
   */
  private async inferActivityWithAI(
    place: PlaceInfo,
    durationMinutes: number,
    arrivedAt: Date,
    departedAt?: Date
  ): Promise<ActivityInference | null> {
    if (!this.env.AI) return null;

    const timeOfDay = arrivedAt.getHours();
    const dayOfWeek = arrivedAt.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDuration = this.formatDuration(durationMinutes);

    const prompt = `A Tesla vehicle stopped at the following location. Based on the place, duration, and timing, what activity most likely occurred?

Place: ${place.name || 'Unknown'}
Type: ${place.place_type || place.place_description || 'Unknown'}
City: ${place.city || 'Unknown'}
Duration: ${formattedDuration}
Day: ${dayOfWeek}
Arrival time: ${arrivedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}

Respond in JSON format:
{
  "activity": "brief description of what the person likely did",
  "confidence": 0.0 to 1.0,
  "reasoning": "why you think this",
  "alternatives": ["other", "possible", "activities"]
}

Examples:
- Golf course, 3.5 hours, Saturday morning → "Played 18 holes of golf"
- Restaurant, 1.5 hours, Friday evening → "Had dinner"
- Supercharger, 25 minutes → "Charged vehicle"`;

    try {
      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      });

      const text = response.response || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          activity: parsed.activity,
          confidence: parsed.confidence || 0.7,
          reasoning: parsed.reasoning || '',
          duration_minutes: durationMinutes,
          alternative_activities: parsed.alternatives,
        };
      }
    } catch (error) {
      logger.warn('AI activity inference failed', { error });
    }

    return null;
  }

  /**
   * Basic activity inference without AI
   */
  private inferActivityBasic(place: PlaceInfo, durationMinutes: number): ActivityInference | null {
    const type = place.place_type?.toLowerCase() || '';
    const name = place.name?.toLowerCase() || '';

    // Golf detection
    if (type.includes('golf') || name.includes('golf') || name.includes('country club')) {
      let activity = 'Visited golf course';
      if (durationMinutes >= 150) activity = 'Played a round of golf (18 holes)';
      else if (durationMinutes >= 60) activity = 'Played 9 holes or practiced';
      else if (durationMinutes >= 30) activity = 'Used driving range';
      
      return {
        activity,
        confidence: 0.75,
        reasoning: `Duration of ${this.formatDuration(durationMinutes)} at golf course`,
        duration_minutes: durationMinutes,
      };
    }

    // Restaurant detection
    if (type.includes('restaurant') || type.includes('food') || name.includes('grill') || name.includes('kitchen')) {
      let activity = 'Visited restaurant';
      if (durationMinutes >= 90) activity = 'Had a leisurely meal';
      else if (durationMinutes >= 45) activity = 'Had a meal';
      else activity = 'Quick bite';
      
      return {
        activity,
        confidence: 0.7,
        reasoning: `Duration of ${this.formatDuration(durationMinutes)} at restaurant`,
        duration_minutes: durationMinutes,
      };
    }

    // Charging detection
    if (type.includes('charging') || name.includes('supercharger') || name.includes('charger')) {
      return {
        activity: durationMinutes > 45 ? 'Full charge' : 'Quick charge',
        confidence: 0.9,
        reasoning: 'EV charging station',
        duration_minutes: durationMinutes,
      };
    }

    // Hotel detection
    if (type.includes('hotel') || type.includes('motel') || type.includes('inn') || name.includes('hotel') || name.includes('inn')) {
      if (durationMinutes >= 360) {
        return {
          activity: 'Overnight stay',
          confidence: 0.85,
          reasoning: `Extended stay of ${this.formatDuration(durationMinutes)}`,
          duration_minutes: durationMinutes,
        };
      }
    }

    // Generic stop
    if (place.name) {
      return {
        activity: `Stopped at ${place.name}`,
        confidence: 0.5,
        reasoning: 'Unable to determine specific activity',
        duration_minutes: durationMinutes,
      };
    }

    return null;
  }

  /**
   * Check if this is an overnight stay
   */
  private isOvernightStay(arrivedAt: Date, departedAt?: Date): boolean {
    if (!departedAt) return false;
    
    const arrivalHour = arrivedAt.getHours();
    const departureHour = departedAt.getHours();
    
    // Arrived after 8 PM and left after 5 AM next day
    if (arrivalHour >= 20 && departureHour >= 5 && departureHour <= 12) {
      const hoursStayed = (departedAt.getTime() - arrivedAt.getTime()) / (1000 * 60 * 60);
      return hoursStayed >= 6;
    }
    
    return false;
  }

  /**
   * Check if this location is likely home
   */
  private async checkIfHome(lat: number, lng: number): Promise<boolean> {
    if (!this.env.TESLA_DB) return false;

    try {
      // Check for frequent overnight stays at this location
      const result = await this.env.TESLA_DB.prepare(`
        SELECT COUNT(DISTINCT date(arrived_at)) as nights
        FROM stops
        WHERE ABS(latitude - ?) < 0.001
          AND ABS(longitude - ?) < 0.001
          AND is_overnight = TRUE
      `).bind(lat, lng).first<{ nights: number }>();

      return (result?.nights || 0) >= 5;
    } catch {
      return false;
    }
  }

  /**
   * Check if this location is likely work
   */
  private async checkIfWork(lat: number, lng: number, arrivedAt: Date): Promise<boolean> {
    if (!this.env.TESLA_DB) return false;

    const dayOfWeek = arrivedAt.getDay();
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    try {
      // Check for frequent weekday visits during work hours
      const result = await this.env.TESLA_DB.prepare(`
        SELECT COUNT(DISTINCT date(arrived_at)) as days
        FROM stops
        WHERE ABS(latitude - ?) < 0.001
          AND ABS(longitude - ?) < 0.001
          AND strftime('%w', arrived_at) BETWEEN '1' AND '5'
          AND strftime('%H', arrived_at) BETWEEN '07' AND '10'
          AND duration_minutes >= 240
      `).bind(lat, lng).first<{ days: number }>();

      return (result?.days || 0) >= 5;
    } catch {
      return false;
    }
  }

  /**
   * Allow user to correct a place classification
   */
  async correctPlace(
    lat: number,
    lng: number,
    corrections: {
      name?: string;
      place_type?: string;
      place_description?: string;
    }
  ): Promise<void> {
    const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    const existing = placeCache.get(cacheKey);
    
    if (existing) {
      const corrected: PlaceInfo = {
        ...existing,
        ...corrections,
        confidence: 1.0,
        source: 'user_defined',
      };
      placeCache.set(cacheKey, corrected);
    }

    // Also save to DB for persistence
    if (this.env.TESLA_DB) {
      try {
        await this.env.TESLA_DB.prepare(`
          INSERT INTO known_places (latitude, longitude, name, category, is_favorite, created_at, updated_at)
          VALUES (?, ?, ?, ?, FALSE, datetime('now'), datetime('now'))
          ON CONFLICT(latitude, longitude) DO UPDATE SET
            name = ?,
            category = ?,
            updated_at = datetime('now')
        `).bind(
          lat, lng,
          corrections.name || '',
          corrections.place_type || '',
          corrections.name || '',
          corrections.place_type || ''
        ).run();
      } catch (error) {
        logger.warn('Failed to save place correction', { error });
      }
    }
  }

  // Helper methods
  private createEmptyPlace(lat: number, lng: number): PlaceInfo {
    return {
      latitude: lat,
      longitude: lng,
      name: null,
      address: null,
      city: null,
      state: null,
      country: null,
      place_type: null,
      place_description: null,
      business_hours: null,
      confidence: 0,
      source: 'geocode',
    };
  }

  private formatAddress(address: any): string | null {
    const parts: string[] = [];
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }
    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village);
    }
    if (address.state) {
      parts.push(address.state);
    }
    return parts.length > 0 ? parts.join(', ') : null;
  }

  private formatDuration(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  }
}

