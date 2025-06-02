import type { Location, WeatherRiskResponse, Route, RouteResponse, Weather, RouteSegment } from './types';
import { verify } from './hmac';

interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
}

interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
}

export interface Env {
    APP_KV: KVNamespace;
    MAP_TILES_KV: KVNamespace;
    EDGE_HMAC_KEY: string;
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
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
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

        // TODO: Replace with actual weather API call
        const mockWeather: Weather = {
            temperature: 20,
            windSpeed: 15,
            precipitation: 0.2,
            conditions: ["cloudy", "rain"]
        };

        const riskLevel = calculateRiskLevel(mockWeather);
        const response: WeatherRiskResponse = {
            location: { latitude, longitude },
            riskLevel,
            weather: mockWeather,
            recommendations: generateWeatherRecommendations(mockWeather, riskLevel)
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

function calculateRouteSegments(coordinates: Location[]): RouteSegment[] {
    const segments: RouteSegment[] = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
        const start = coordinates[i];
        const end = coordinates[i + 1];
        const distance = Math.sqrt(
            Math.pow(end.latitude - start.latitude, 2) + Math.pow(end.longitude - start.longitude, 2)
        ) * 111; // Rough km conversion
        segments.push({
            start,
            end,
            distance,
            duration: distance * 60, // Rough minutes calculation
            weatherRisk: Math.random()
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

        // Generate waypoints for the route
        const coordinates: Location[] = [
            origin,
            {
                latitude: (origin.latitude + destination.latitude) / 2,
                longitude: (origin.longitude + destination.longitude) / 2
            },
            destination
        ];

        const segments = calculateRouteSegments(coordinates);
        const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
        const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
        
        // Weather risk calculation
        const baseRisk = avoidWeather ? 0.2 : 0.6;
        const weatherRisk = Math.min(1, Math.max(0, baseRisk));

        const route: Route = {
            segments,
            coordinates,
            totalDistance,
            totalDuration,
            weatherRisk,
            totalConsumption: totalDistance * 0.2, // Rough kWh calculation
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

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        
        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-signature',
                    'Access-Control-Max-Age': '86400'
                }
            });
        }
        
        try {
            if (url.pathname === "/weather-risk") {
                const response = await handleWeatherRisk(request, env);
                return addCorsHeaders(response);
            } else if (url.pathname === "/optimize-route") {
                const response = await handleRouteOptimization(request, env);
                return addCorsHeaders(response);
            } else {
                // Serve static files for all other routes
                const response = await handleStaticFile(request, env);
                return addCorsHeaders(response);
            }
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
