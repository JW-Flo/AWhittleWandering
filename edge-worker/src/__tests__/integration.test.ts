import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { WeatherRiskResponse, RouteResponse } from '../types';
import { createTestEnv, cleanupTestEnv, calculateHmacSignature } from './test-utils';
import type { TestEnv } from './test-utils';

describe('Edge Worker Integration Tests', () => {
    let testEnv: TestEnv;

    beforeEach(async () => {
        testEnv = await createTestEnv();
    });

    afterEach(async () => {
        await cleanupTestEnv(testEnv);
    });

    describe('Weather Risk Calculation', () => {
        it('should calculate weather risk for a given location', async () => {
            const body = testEnv.mockLocations.sf;
            const signature = await calculateHmacSignature(body);
            
            const res = await testEnv.mf.dispatchFetch('http://localhost:8787/weather-risk', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-signature': signature
                },
                body: JSON.stringify(body)
            });
            expect(res.status).toBe(200);
            const data = await res.json() as WeatherRiskResponse;
            expect(data.weather).toBeDefined();
            expect(data.weather.conditions).toBeDefined();
            expect(data.riskLevel).toBeDefined();
            expect(['low', 'medium', 'high']).toContain(data.riskLevel);
        });

        it('should handle invalid location data', async () => {
            const body = { latitude: 1000, longitude: 2000 };
            const signature = await calculateHmacSignature(body);
            
            const res = await testEnv.mf.dispatchFetch('http://localhost:8787/weather-risk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-signature': signature
                },
                body: JSON.stringify(body)
            });

            expect(res.status).toBe(400);
        });
    });

    describe('Route Optimization', () => {
        it('should optimize route with weather considerations', async () => {
            const body = {
                origin: testEnv.mockLocations.sf,
                destination: testEnv.mockLocations.la,
                avoidWeather: true
            };
            const signature = await calculateHmacSignature(body);
            
            const res = await testEnv.mf.dispatchFetch('http://localhost:8787/optimize-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-signature': signature
                },
                body: JSON.stringify(body)
            });

            expect(res.status).toBe(200);
            const data = await res.json() as RouteResponse;
            expect(data.route).toBeDefined();
            expect(data.route.segments).toBeDefined();
            expect(data.route.segments.length).toBeGreaterThan(0);
        });

        it('should provide different routes based on weather conditions', async () => {
            const normalBody = {
                origin: testEnv.mockLocations.sf,
                destination: testEnv.mockLocations.la,
                avoidWeather: false
            };
            const severeBody = {
                origin: testEnv.mockLocations.sf,
                destination: testEnv.mockLocations.la,
                avoidWeather: true
            };
            const normalSignature = await calculateHmacSignature(normalBody);
            const severeSignature = await calculateHmacSignature(severeBody);
            
            const normalRes = await testEnv.mf.dispatchFetch('http://localhost:8787/optimize-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-signature': normalSignature
                },
                body: JSON.stringify(normalBody)
            });

            const severeRes = await testEnv.mf.dispatchFetch('http://localhost:8787/optimize-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-signature': severeSignature
                },
                body: JSON.stringify(severeBody)
            });

            expect(normalRes.status).toBe(200);
            expect(severeRes.status).toBe(200);

            const normalRoute = (await normalRes.json() as RouteResponse).route;
            const severeRoute = (await severeRes.json() as RouteResponse).route;

            expect(normalRoute.totalDistance).not.toBe(severeRoute.totalDistance);
            expect(normalRoute.totalConsumption).toBeLessThan(severeRoute.totalConsumption);
        });
    });
});
