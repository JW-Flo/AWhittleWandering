/**
 * Itinerary API endpoints
 * 
 * This module provides API endpoints for accessing the 48 Continental USA itinerary:
 * - GET /api/itinerary - Returns the full itinerary
 * - GET /api/itinerary/current - Returns the current/upcoming stop based on date
 * - GET /api/itinerary/state/:state - Returns stops filtered by state
 */

import { Itinerary, getCurrentStop, getStopsByState } from '../../shared/models/itinerary';
import { WorkerEnvironment } from './types/cloudflare';

const ITINERARY_KEY = 'itinerary';

/**
 * Get the full itinerary
 */
export async function getItinerary(env: WorkerEnvironment): Promise<Itinerary | null> {
  try {
    const itineraryJson = await env.ITINERARY_KV.get(ITINERARY_KEY);
    if (!itineraryJson) return null;
    return JSON.parse(itineraryJson);
  } catch (error) {
    console.error('Error getting itinerary:', error);
    return null;
  }
}

/**
 * Update the itinerary in KV storage
 */
export async function updateItinerary(env: WorkerEnvironment, itinerary: Itinerary): Promise<boolean> {
  try {
    // Update the lastUpdated timestamp
    itinerary.lastUpdated = new Date().toISOString();
    await env.ITINERARY_KV.put(ITINERARY_KEY, JSON.stringify(itinerary));
    return true;
  } catch (error) {
    console.error('Error updating itinerary:', error);
    return false;
  }
}

/**
 * Add CORS headers to a Response
 */
function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Handle itinerary API requests
 */
export async function handleItineraryRequest(request: Request, env: WorkerEnvironment): Promise<Response> {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new Response(null, {
      headers: {
        'Access-Control-Max-Age': '86400'
      }
    });
    return addCorsHeaders(response);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/itinerary\/?/, '').toLowerCase();
  
  // Get the full itinerary from KV
  const itinerary = await getItinerary(env);
  
  if (!itinerary) {
    return addCorsHeaders(new Response(JSON.stringify({ error: 'Itinerary not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
  
  // Handle different endpoints
  switch (path) {
    case '':
      // GET /api/itinerary - Return the full itinerary
      return addCorsHeaders(new Response(JSON.stringify(itinerary), {
        headers: { 'Content-Type': 'application/json' }
      }));
      
    case 'current': {
      // GET /api/itinerary/current - Return the current stop
      const currentStop = getCurrentStop(itinerary);
      if (!currentStop) {
        return addCorsHeaders(new Response(JSON.stringify({ error: 'No current or upcoming stops found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      return addCorsHeaders(new Response(JSON.stringify(currentStop), {
        headers: { 'Content-Type': 'application/json' }
      }));
    }
      
    default:
      // Check if it's a state filter request
      if (path.startsWith('state/')) {
        const state = path.replace('state/', '');
        const stateStops = getStopsByState(itinerary, state);
        
        if (stateStops.length === 0) {
          return addCorsHeaders(new Response(JSON.stringify({ error: `No stops found in state: ${state}` }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        return addCorsHeaders(new Response(JSON.stringify(stateStops), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Unknown endpoint
      return addCorsHeaders(new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }));
  }
}
