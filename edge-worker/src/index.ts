interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
}

import type { Location, WeatherRiskResponse, Route, RouteResponse } from './types';

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
    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
        return false;
    }
    const signature = signatureHeader.slice(7);
    const keyData = new TextEncoder().encode(key);
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const expected = await crypto.subtle.sign("HMAC", cryptoKey, body);
    const expectedHex = Array.from(new Uint8Array(expected))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return signature === expectedHex;
}

function calculateRiskLevel(weather: { temperature: number; windSpeed: number; precipitation: number; conditions: string[] }): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // Temperature risk (extreme temperatures)
    if (weather.temperature < 0 || weather.temperature > 35) {
        riskScore += 2;
    } else if (weather.temperature < 5 || weather.temperature > 30) {
        riskScore += 1;
    }
    
    // Wind risk
    if (weather.windSpeed > 50) {
        riskScore += 3;
    } else if (weather.windSpeed > 30) {
        riskScore += 2;
    } else if (weather.windSpeed > 20) {
        riskScore += 1;
    }
    
    // Precipitation risk
    if (weather.precipitation > 25) {
        riskScore += 3;
    } else if (weather.precipitation > 10) {
        riskScore += 2;
    } else if (weather.precipitation > 5) {
        riskScore += 1;
    }
    
    // Conditions risk
    const dangerousConditions = ['thunderstorm', 'tornado', 'hurricane', 'blizzard'];
    const moderateConditions = ['rain', 'snow', 'sleet', 'fog'];
    
    for (const condition of weather.conditions) {
        if (dangerousConditions.includes(condition.toLowerCase())) {
            riskScore += 3;
        } else if (moderateConditions.includes(condition.toLowerCase())) {
            riskScore += 1;
        }
    }
    
    // Convert score to risk level
    if (riskScore >= 5) {
        return 'high';
    } else if (riskScore >= 2) {
        return 'medium';
    }
    return 'low';
}

function generateWeatherRecommendations(weather: { temperature: number; windSpeed: number; precipitation: number; conditions: string[] }, riskLevel: 'low' | 'medium' | 'high'): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'high') {
        recommendations.push('Consider postponing non-essential travel');
    }
    
    if (weather.temperature < 0) {
        recommendations.push('Risk of icy conditions. Ensure vehicle is properly equipped for winter weather');
    } else if (weather.temperature > 35) {
        recommendations.push('High temperature may affect vehicle performance. Ensure cooling system is working properly');
    }
    
    if (weather.windSpeed > 30) {
        recommendations.push('Strong winds may affect vehicle stability. Drive with caution');
    }
    
    if (weather.precipitation > 10) {
        recommendations.push('Heavy precipitation. Reduce speed and increase following distance');
    }
    
    for (const condition of weather.conditions) {
        switch(condition.toLowerCase()) {
            case 'fog':
                recommendations.push('Reduced visibility. Use fog lights and reduce speed');
                break;
            case 'snow':
            case 'sleet':
                recommendations.push('Winter weather conditions. Use appropriate tires and drive cautiously');
                break;
            case 'thunderstorm':
                recommendations.push('Severe weather. Seek shelter if conditions worsen');
                break;
        }
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Safe to travel. Normal driving conditions');
    }
    
    return recommendations;
}

async function handleWeatherRisk(request: Request): Promise<Response> {
    const location = await request.json() as Location;
    
    // Validate location data
    if (!location.latitude || !location.longitude || 
        location.latitude < -90 || location.latitude > 90 || 
        location.longitude < -180 || location.longitude > 180) {
        return new Response(JSON.stringify({ error: 'Invalid location data' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Mock weather data (in production, this would come from a weather API)
    const weather = {
        temperature: 20 + Math.random() * 10,
        windSpeed: Math.random() * 40,
        precipitation: Math.random() * 20,
        conditions: ['clear']
    };

    // Calculate risk level
    const riskLevel = calculateRiskLevel(weather);
    
    // Generate recommendations
    const recommendations = generateWeatherRecommendations(weather, riskLevel);

    const response: WeatherRiskResponse = {
        location,
        weather,
        riskLevel,
        recommendations
    };

    return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function handleOptimizeRoute(request: Request): Promise<Response> {
    const { origin, destination, avoidWeather = false } = await request.json() as { 
        origin: Location; 
        destination: Location;
        avoidWeather?: boolean;
    };

    // Validate input
    if (!origin || !destination ||
        !origin.latitude || !origin.longitude ||
        !destination.latitude || !destination.longitude) {
        return new Response(JSON.stringify({ error: 'Invalid route data' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Mock weather data for different points along the route
    const originWeather = {
        temperature: 20 + Math.random() * 10,
        windSpeed: Math.random() * 40,
        precipitation: Math.random() * 20,
        conditions: ['clear']
    };

    const midpointWeather = {
        temperature: 22 + Math.random() * 10,
        windSpeed: 15 + Math.random() * 40,
        precipitation: 5 + Math.random() * 20,
        conditions: avoidWeather ? ['rain', 'wind'] : ['clear']
    };

    // Calculate risk levels
    const originRisk = calculateRiskLevel(originWeather);
    const midpointRisk = calculateRiskLevel(midpointWeather);

    // Calculate route based on weather risks
    const baseDistance = 100;
    const baseConsumption = 20;
    const weatherMultiplier = avoidWeather && (originRisk === 'high' || midpointRisk === 'high') ? 1.4 : 1.0;

    // Calculate midpoint for the route
    const midpoint: Location = {
        latitude: (origin.latitude + destination.latitude) / 2,
        longitude: (origin.longitude + destination.longitude) / 2
    };

    const response: RouteResponse = {
        route: {
            segments: [
                {
                    start: origin,
                    end: midpoint,
                    distance: (baseDistance / 2) * weatherMultiplier,
                    estimatedConsumption: (baseConsumption / 2) * weatherMultiplier
                },
                {
                    start: midpoint,
                    end: destination,
                    distance: (baseDistance / 2) * weatherMultiplier,
                    estimatedConsumption: (baseConsumption / 2) * weatherMultiplier
                }
            ],
            totalDistance: baseDistance * weatherMultiplier,
            totalConsumption: baseConsumption * weatherMultiplier
        },
        weatherRisks: [
            {
                location: origin,
                weather: originWeather,
                riskLevel: originRisk,
                recommendations: generateWeatherRecommendations(originWeather, originRisk)
            },
            {
                location: midpoint,
                weather: midpointWeather,
                riskLevel: midpointRisk,
                recommendations: generateWeatherRecommendations(midpointWeather, midpointRisk)
            }
        ]
    };

    return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
    });
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // Verify HMAC signature for authenticated endpoints
        if (request.method === 'POST') {
            const clonedRequest = request.clone();
            const body = await clonedRequest.arrayBuffer();
            const signature = request.headers.get('x-signature');
            const isValid = await verifySignature(body, env.EDGE_HMAC_KEY, signature);
            
            if (!isValid) {
                return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        try {
            switch (url.pathname) {
                case '/weather-risk':
                    if (request.method === 'POST') {
                        return await handleWeatherRisk(request);
                    }
                    break;
                case '/optimize-route':
                    if (request.method === 'POST') {
                        return await handleOptimizeRoute(request);
                    }
                    break;
            }

            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Error handling request:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};
