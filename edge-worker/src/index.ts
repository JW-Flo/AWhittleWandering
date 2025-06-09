import type { Location, WeatherRiskResponse, Route, RouteResponse, Weather, RouteSegment } from './types';
import { verify } from './hmac';
import { TeslaAPIClient } from './utils/tesla-client';
import { TessieAPIClient } from './tessie-client';
import { getToken, setToken } from './utils/tesla-tokens';
import { handleEmailSubscribe, handleEmailNotify } from './email';
import { handleItineraryRequest } from './itinerary';
import { WorkerEnvironment, KVNamespace } from './types/cloudflare';
import { fetchWeatherData, isFavorableForEV } from './utils/weather-api';
// Import required types and modules
import { onRequest as handleVehicleStream } from './vehicle-stream';

// Interface for Cloudflare Workers execution context
// This is used by the Workers runtime but not directly in our code
/** @deprecated - Kept for reference */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
}

// Define DurableObjectNamespace interface
interface DurableObjectNamespace {
    idFromName(name: string): DurableObjectId;
    idFromString(hex: string): DurableObjectId;
    get(id: DurableObjectId): DurableObject;
}

interface DurableObjectId {
    toString(): string;
}

interface DurableObject {
    fetch(request: Request): Promise<Response>;
}

// Using WorkerEnvironment from types/cloudflare.ts 
export interface Env extends WorkerEnvironment {
    ITINERARY_KV: KVNamespace;
    SYNC_SERVICE_DO: DurableObjectNamespace;
}

async function verifySignature(
    body: ArrayBuffer,
    key: string,
    signatureHeader: string | null
): Promise<boolean> {
    console.log("Verifying signature with header:", signatureHeader);
    if (!signatureHeader) {
        console.log("Missing signature header");
        return false;
    }
    
    try {
        return await verify(body, signatureHeader, key);
    } catch (err) {
        console.error("Signature verification error:", err);
        return false;
    }
}

function calculateRiskLevel(weather: Weather): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // Temperature risk
    if (weather.temperature < 0 || weather.temperature > 35) riskScore += 2;
    else if (weather.temperature < 5 || weather.temperature > 30) riskScore += 1;
    
    // Wind risk
    if (weather.windSpeed > 50) riskScore += 3;
    else if (weather.windSpeed > 30) riskScore += 2;
    else if (weather.windSpeed > 20) riskScore += 1;
    
    // Precipitation risk
    if (weather.precipitation > 0.5) riskScore += 2;
    else if (weather.precipitation > 0.2) riskScore += 1;
    
    // Conditions risk
    const severeConditions = ['thunderstorm', 'snow', 'ice', 'hail', 'tornado'];
    const moderateConditions = ['rain', 'fog', 'strong-wind'];
    
    if (weather.conditions.some(c => severeConditions.includes(c))) riskScore += 3;
    else if (weather.conditions.some(c => moderateConditions.includes(c))) riskScore += 1;
    
    return riskScore >= 5 ? 'high' : riskScore >= 3 ? 'medium' : 'low';
}

function generateWeatherRecommendations(weather: Weather, riskLevel: 'low' | 'medium' | 'high'): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'high') {
        recommendations.push('Consider postponing non-essential travel');
    }
    
    if (weather.temperature < 0) {
        recommendations.push('Watch for icy conditions');
    } else if (weather.temperature > 30) {
        recommendations.push('Monitor vehicle temperature');
    }
    
    if (weather.windSpeed > 30) {
        recommendations.push('Strong winds may affect vehicle stability');
    }
    
    if (weather.precipitation > 0.2) {
        recommendations.push('Reduce speed in wet conditions');
    }
    
    return recommendations;
}

function addCorsHeaders(response: Response): Response {
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature');
    headers.set('Access-Control-Max-Age', '86400');
    
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

async function handleStaticFile(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const contentType = path.endsWith('.html') ? 'text/html' :
                       path.endsWith('.js') ? 'text/javascript' :
                       path.endsWith('.css') ? 'text/css' :
                       'text/plain';
    
    try {
        const file = await env.APP_KV.get(path);
        if (file === null) {
            return new Response('Not Found', { status: 404 });
        }
        
        return new Response(file, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'max-age=3600'
            }
        });
    } catch (error) {
        return new Response('Internal Server Error', { status: 500 });
    }
}

async function handleWeatherRisk(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-signature',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const arrayBuffer = await request.arrayBuffer();
        const signature = request.headers.get("x-signature");
        const isValid = await verifySignature(arrayBuffer, env.EDGE_HMAC_KEY, signature);
        
        if (!isValid) {
            return new Response(JSON.stringify({ error: "Invalid signature" }), {
                status: 401,
                headers: corsHeaders
            });
        }

        const body = JSON.parse(new TextDecoder().decode(arrayBuffer));
        const { latitude, longitude } = body;

        // Validate coordinates exist and are numbers
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return new Response(JSON.stringify({ error: "Invalid coordinates: latitude and longitude must be numbers" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Validate coordinate ranges (Continental USA bounds)
        if (latitude < 24.396308 || latitude > 49.384358 || 
            longitude < -125.000000 || longitude > -66.934570) {
            return new Response(JSON.stringify({ 
                error: "Coordinates out of bounds: must be within Continental USA" 
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Fetch real weather data from the API
        const weatherApiKey = (env.OPENWEATHER_API_KEY?.trim()) || (env.WEATHER_API_KEY?.trim()) || '';
        const weather = await fetchWeatherData(latitude, longitude, weatherApiKey);
        
        // Calculate weather risk level
        const riskLevel = calculateRiskLevel(weather);
        
        // Check if the conditions are favorable for EV travel
        const isFavorable = isFavorableForEV(weather);
        
        const response: WeatherRiskResponse = {
            location: { latitude, longitude },
            riskLevel,
            weather,
            recommendations: generateWeatherRecommendations(weather, riskLevel),
            isFavorableForEV: isFavorable
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Weather risk error:', error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

function calculateRouteSegments(coordinates: Location[], avoidWeather = false): RouteSegment[] {
    const segments: RouteSegment[] = [];
    
    for (let i = 0; i < coordinates.length - 1; i++) {
        const start = coordinates[i];
        const end = coordinates[i + 1];
        
        // Base distance calculation using Haversine formula for more accuracy
        const R = 6371; // Earth radius in km
        const dLat = (end.latitude - start.latitude) * Math.PI / 180;
        const dLon = (end.longitude - start.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Apply a multiplier for weather-avoiding routes to represent detours
        const weatherMultiplier = avoidWeather ? 1.15 : 1.0; // 15% longer for weather avoidance
        const adjustedDistance = distance * weatherMultiplier;
        
        segments.push({
            start,
            end,
            distance: adjustedDistance,
            duration: adjustedDistance * 60, // Rough minutes calculation
            weatherRisk: avoidWeather ? Math.random() * 0.3 : Math.random() * 0.7 // Lower risk for weather-avoiding routes
        });
    }
    
    return segments;
}

async function handleRouteOptimization(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-signature',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const arrayBuffer = await request.arrayBuffer();
        const signature = request.headers.get("x-signature");
        const isValid = await verifySignature(arrayBuffer, env.EDGE_HMAC_KEY, signature);
        
        if (!isValid) {
            return new Response(JSON.stringify({ error: "Invalid signature" }), {
                status: 401,
                headers: corsHeaders
            });
        }

        const body = JSON.parse(new TextDecoder().decode(arrayBuffer));
        const { origin, destination, avoidWeather = false } = body;

        // Validate origin and destination
        if (!origin || !destination) {
            return new Response(JSON.stringify({ 
                error: "Missing required fields: origin and destination" 
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Validate coordinates
        const validateCoords = (loc: { latitude?: number; longitude?: number }, name: string): string | null => {
            if (typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
                return `Invalid ${name} coordinates: latitude and longitude must be numbers`;
            }
            if (loc.latitude < 24.396308 || loc.latitude > 49.384358 || 
                loc.longitude < -125.000000 || loc.longitude > -66.934570) {
                return `${name} coordinates out of bounds: must be within Continental USA`;
            }
            return null;
        };

        const originError = validateCoords(origin, 'origin');
        const destError = validateCoords(destination, 'destination');

        if (originError || destError) {
            return new Response(JSON.stringify({ 
                error: originError || destError 
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Generate waypoints for the route with slight variation if avoiding weather
        let coordinates: Location[];
        
        if (avoidWeather) {
            // Create a slightly different route when avoiding weather
            const midpointOffset = 0.05; // Add an offset to create a different route
            coordinates = [
                origin,
                {
                    latitude: (origin.latitude + destination.latitude) / 2 + midpointOffset,
                    longitude: (origin.longitude + destination.longitude) / 2 + midpointOffset
                },
                destination
            ];
        } else {
            coordinates = [
                origin,
                {
                    latitude: (origin.latitude + destination.latitude) / 2,
                    longitude: (origin.longitude + destination.longitude) / 2
                },
                destination
            ];
        }

        const segments = calculateRouteSegments(coordinates, avoidWeather);
        const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
        const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
        
        // Weather risk calculation - lower risk when avoiding weather
        const baseRisk = avoidWeather ? 0.2 : 0.6;
        const weatherRisk = Math.min(1, Math.max(0, baseRisk));

        // Calculate consumption rate based on weather risk
        const consumptionRate = avoidWeather ? 0.22 : 0.2; // Higher consumption for avoiding weather (longer route)
        
        const route: Route = {
            segments,
            coordinates,
            totalDistance,
            totalDuration,
            weatherRisk,
            totalConsumption: totalDistance * consumptionRate, // Adjusted kWh calculation
            requiredStops: Math.max(1, Math.ceil(totalDistance / 300)) // At least 1 stop if > 300 miles
        };

        // Generate alternative routes with slightly different risks
        const response: RouteResponse = {
            route,
            alternatives: [
                {
                    ...route,
                    weatherRisk: Math.min(1, route.weatherRisk * 1.2),
                    coordinates: [...route.coordinates],
                    segments: [...route.segments]
                },
                {
                    ...route,
                    weatherRisk: Math.max(0, route.weatherRisk * 0.8),
                    coordinates: [...route.coordinates],
                    segments: [...route.segments]
                }
            ]
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Route optimization error:', error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// --- TESSIE API HANDLERS ---

// Global variable to store the last successful vehicle data
let lastKnownVehicleData: VehicleData | null = null;

interface VehicleData {
    last_updated: string;
    cached: boolean;
    error_message?: string;
    [key: string]: unknown; // Allow additional properties
}
async function handleTessieVehicle(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    try {
        // First attempt to use the real Tessie API if configured
        if (env.TESSIE_API_TOKEN && env.TESSIE_VIN) {
            try {
                // Log attempt to use Tessie API
                console.log('Attempting to use Tessie API with VIN:', env.TESSIE_VIN);
                
                // Create Tessie client
                const tessieClient = new TessieAPIClient(env);
                
                // Get vehicle state from Tessie with timeout to prevent hanging requests
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Tessie API request timed out')), 5000);
                });
                
                const vehicleDataPromise = tessieClient.getVehicleState();
                
                // Race the API call against a timeout
                const vehicleData = await Promise.race([vehicleDataPromise, timeoutPromise]) as Record<string, any>;
                
                if (!vehicleData || !vehicleData.drive_state) {
                    throw new Error('Invalid vehicle data received from Tessie API');
                }
                
                // Transform to standard format
                const transformedData = tessieClient.transformToStandardFormat(vehicleData);
                
                // Store successful data for future use
                lastKnownVehicleData = transformedData;
                
                console.log('Successfully retrieved vehicle data from Tessie API');
                
                return new Response(JSON.stringify(transformedData), {
                    status: 200,
                    headers: corsHeaders
                });
            } catch (tessieError) {
                console.error('Tessie API error:', tessieError);
                
                // Use last known data if available
                if (lastKnownVehicleData) {
                    console.log('Using cached vehicle data from previous successful request');
                    
                    // Update timestamp to show it's cached data
                    const cachedData = {
                        ...lastKnownVehicleData,
                        last_updated: new Date().toISOString(),
                        cached: true
                    };
                    
                    return new Response(JSON.stringify(cachedData), {
                        status: 200,
                        headers: corsHeaders
                    });
                } else {
                    // If no cached data, we need to return a proper error
                    console.error('No cached vehicle data available');
                    throw new Error('No vehicle data available and Tessie API request failed');
                }
            }
        } else {
            console.log('Tessie API not configured properly');
            throw new Error('Tessie API token or VIN missing from configuration');
        }
    } catch (error) {
        console.error('Vehicle API error:', error);
        
        // If we have last known data, return it even in case of errors
        if (lastKnownVehicleData) {
            console.log('Using cached vehicle data after error');
            
            const cachedData = {
                ...lastKnownVehicleData,
                last_updated: new Date().toISOString(),
                cached: true,
                error_message: error instanceof Error ? error.message : 'Unknown error'
            };
            
            return new Response(JSON.stringify(cachedData), {
                status: 200,
                headers: corsHeaders
            });
        }
        
        // If no cached data at all, we have to return an error
        return new Response(JSON.stringify({ 
            error: 'Failed to fetch vehicle data',
            message: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 503, // Service Unavailable - first-time initialization failed
            headers: corsHeaders
        });
    }
}

// --- TESLA API PROXY HANDLERS ---

async function handleTeslaVehicle(request: Request, env: Env): Promise<Response> {
    try {
        const token = await getToken(env);
        if (!token) {
            return new Response(JSON.stringify({ error: 'Tesla token not set' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
        const client = new TeslaAPIClient({
            clientId: env.TESLA_CLIENT_ID!,
            clientSecret: env.TESLA_CLIENT_SECRET!,
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
        });
        const vehicles = await client.listVehicles();
        if (!vehicles || vehicles.length === 0) {
            return new Response(JSON.stringify({ error: 'No vehicles found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
        const vehicle = vehicles[0];
        const data = await client.getVehicleData(vehicle.id_s);
        return new Response(JSON.stringify({ vehicle: data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to fetch Tesla data', details: String(err) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

async function handleTeslaAuth(request: Request, env: Env): Promise<Response> {
    // TODO: Add admin JWT verification
    const body = await request.json();
    if (!body.access_token || !body.refresh_token) {
        return new Response(JSON.stringify({ error: 'Missing tokens' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
    await setToken(env, body);
    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
}

async function handleSyncService(request: Request, env: Env): Promise<Response> {
    // Verify it's a WebSocket request
    if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 400 });
    }

    const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
    const syncObj = env.SYNC_SERVICE_DO.get(id);
    
    // Pass the request to the Durable Object
    return syncObj.fetch(request);
}

// Add weather and stations endpoints
async function handleWeatherAPI(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    try {
        const url = new URL(request.url);
        const lat = url.searchParams.get('lat') || '27.741777';
        const lon = url.searchParams.get('lon') || '-97.388844';
        
        const weatherApiKey = (env.OPENWEATHER_API_KEY?.trim()) || (env.WEATHER_API_KEY?.trim()) || '';
        const weather = await fetchWeatherData(parseFloat(lat), parseFloat(lon), weatherApiKey);
        
        return new Response(JSON.stringify(weather), {
            status: 200,
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Weather API error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to fetch weather data',
            message: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

async function handleStationsAPI(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    try {
        const url = new URL(request.url);
        const lat = parseFloat(url.searchParams.get('lat') || '27.741777');
        const lon = parseFloat(url.searchParams.get('lon') || '-97.388844');
        
        // Mock charging stations data for now
        const stations = {
            stations: [
                {
                    id: "station-1",
                    name: "Tesla Supercharger - Corpus Christi",
                    latitude: lat + 0.01,
                    longitude: lon + 0.01,
                    address: "5488 S Padre Island Dr, Corpus Christi, TX 78411",
                    distance: 2.3,
                    available: 8,
                    total: 12,
                    power: 250
                },
                {
                    id: "station-2",
                    name: "ChargePoint - HEB Plus",
                    latitude: lat - 0.02,
                    longitude: lon + 0.005,
                    address: "1145 Waldron Rd, Corpus Christi, TX 78418",
                    distance: 4.1,
                    available: 2,
                    total: 4,
                    power: 150
                }
            ]
        };
        
        return new Response(JSON.stringify(stations), {
            status: 200,
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Stations API error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to fetch charging stations',
            message: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

async function handleTripAPI(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    try {
        // For now, return mock trip data
        // In production, this would fetch from a database or calculate from itinerary
        const tripData = {
            visitedStates: [
                "TX", "LA", "MS", "AL", "FL", "GA", "SC", "NC", "VA", "WV",
                "KY", "TN", "AR", "MO", "IL", "IN", "OH", "MI", "WI", "MN",
                "IA", "NE", "CO"
            ],
            currentState: "TX",
            nextStop: {
                city: "Houston",
                state: "TX",
                eta: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            },
            distanceToNext: 142,
            route: [
                { latitude: 27.8006, longitude: -97.3964 },
                { latitude: 29.7604, longitude: -95.3698 }
            ],
            stops: [
                {
                    id: "1",
                    name: "Corpus Christi",
                    latitude: 27.8006,
                    longitude: -97.3964,
                    type: "current",
                    description: "Current location",
                    charging: true,
                    overnight: false
                },
                {
                    id: "2",
                    name: "Houston",
                    latitude: 29.7604,
                    longitude: -95.3698,
                    type: "next",
                    description: "Next destination",
                    charging: true,
                    overnight: true
                }
            ]
        };
        
        return new Response(JSON.stringify(tripData), {
            status: 200,
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Trip API error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to fetch trip data',
            message: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // --- HOME PAGE / INDEX ROUTE ---
        if (url.pathname === "/" || url.pathname === "/index.html") {
            return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>48 Continental USA - Edge API</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 1rem; 
        }
        h1 { color: #2563eb; }
        .endpoint { 
            background: #f5f5f5; 
            padding: 1rem; 
            border-radius: 4px; 
            margin-bottom: 1rem; 
            border-left: 4px solid #2563eb;
        }
        code { 
            background: #e5e7eb; 
            padding: 0.2rem 0.4rem; 
            border-radius: 2px; 
            font-size: 0.9em; 
        }
        .status {
            display: inline-block;
            margin-left: 0.5rem;
            padding: 0.25rem 0.5rem;
            border-radius: 2px;
            font-size: 0.8em;
            background: #10b981;
            color: white;
        }
        footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
            font-size: 0.9em;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <h1>48 Continental USA - Edge API</h1>
    <p>This is the API server for the 48 Continental USA Tesla road trip project. The following endpoints are available:</p>
    
    <div class="endpoint">
        <h3>Weather <span class="status">LIVE</span></h3>
        <code>GET /api/weather</code>
        <p>Get weather information for a location.</p>
    </div>
    
    <div class="endpoint">
        <h3>Vehicle <span class="status">LIVE</span></h3>
        <code>GET /api/vehicle</code>
        <p>Get current vehicle status including location, battery level, and charging state.</p>
    </div>
    
    <div class="endpoint">
        <h3>Trip <span class="status">LIVE</span></h3>
        <code>GET /api/trip</code>
        <p>Get current trip information including visited states and next destination.</p>
    </div>
    
    <div class="endpoint">
        <h3>Charging Stations <span class="status">LIVE</span></h3>
        <code>GET /api/stations?lat={latitude}&lon={longitude}</code>
        <p>Find charging stations near a location. Requires latitude and longitude parameters.</p>
    </div>
    
    <div class="endpoint">
        <h3>Itinerary <span class="status">LIVE</span></h3>
        <code>GET /api/itinerary</code>
        <p>Get the full trip itinerary with all planned stops.</p>
    </div>
    
    <footer>
        <p>Visit <a href="https://continentalusa-site.pages.dev">the trip dashboard</a> to see this data in action.</p>
        <p>Last updated: June 5, 2025</p>
    </footer>
</body>
</html>
            `, {
                headers: {
                    "Content-Type": "text/html",
                    "Cache-Control": "max-age=3600"
                }
            });
        }

        // --- TEST ENDPOINT ---
        if (url.pathname === "/test" || url.pathname === "/api/v1/status") {
            return new Response(JSON.stringify({
                status: "ok",
                version: "1.0.0",
                time: new Date().toISOString(),
                environment: "production"
            }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-signature"
                }
            });
        }

        // --- SYNC SERVICE ROUTE ---
        if (url.pathname === "/sync-service") {
            return await handleSyncService(request, env);
        }

        // --- VEHICLE API ROUTES ---
        // Main vehicle endpoint used by frontend
        if (url.pathname === "/api/vehicle" && request.method === "GET") {
            return await handleTessieVehicle(request, env);
        }
        
        // --- TRIP API ROUTE ---
        if (url.pathname === "/api/trip" && request.method === "GET") {
            return await handleTripAPI(request, env);
        }
        
        // --- WEATHER AND STATIONS API ROUTES ---
        if (url.pathname === "/api/weather" && request.method === "GET") {
            return await handleWeatherAPI(request, env);
        }
        if (url.pathname === "/api/stations" && request.method === "GET") {
            return await handleStationsAPI(request, env);
        }
        
        // --- TESLA API ROUTES (Legacy) ---
        if (url.pathname === "/tesla/vehicle" && request.method === "GET") {
            return await handleTeslaVehicle(request, env);
        }
        if (url.pathname === "/tesla/vehicle/stream") {
            return await handleVehicleStream(request, env);
        }
        if (url.pathname === "/tesla/auth" && request.method === "POST") {
            return await handleTeslaAuth(request, env);
        }

        // --- EMAIL SUBSCRIPTION ROUTES ---
        if (url.pathname === "/email/subscribe" && request.method === "POST") {
            return await handleEmailSubscribe(request, env);
        }
        if (url.pathname === "/email/notify" && request.method === "POST") {
            return await handleEmailNotify(request, env);
        }
        
        // --- ITINERARY ROUTES ---
        if (url.pathname.startsWith("/api/itinerary")) {
            return await handleItineraryRequest(request, env);
        }

// Handle CORS preflight requests
if (request.method === 'OPTIONS') {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-signature',
            'Access-Control-Max-Age': '86400'
        }
    });
}
        
        try {
            // Apply CORS to all responses
            let response;
            
            if (url.pathname === "/weather-risk") {
                response = await handleWeatherRisk(request, env);
            } else if (url.pathname === "/optimize-route") {
                response = await handleRouteOptimization(request, env);
            } else if (url.pathname === "/test" || url.pathname === "/api/v1/status") {
                // Ensure test endpoints have CORS headers too
                response = new Response(JSON.stringify({
                    status: "ok",
                    version: "1.0.0",
                    time: new Date().toISOString(),
                    environment: "production"
                }), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
            } else {
                // Serve static files for all other routes
                response = await handleStaticFile(request, env);
            }
            
            // Apply CORS headers to all responses
            return addCorsHeaders(response);
        } catch (error) {
            console.error('Error:', error);
            const errorResponse = new Response(JSON.stringify({ error: "Internal server error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
            return addCorsHeaders(errorResponse);
        }
    }
};

// Export the Durable Object class
export { SyncServiceDurableObject } from '../../shared/agent-coordination/syncService';
