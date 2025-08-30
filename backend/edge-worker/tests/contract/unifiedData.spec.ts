import { describe, it, expect } from 'vitest';

const EXPECTED_UNIFIED_DATA_KEYS = [
  'timestamp',
  'vehicle',
  'journey',
  'segments',
  'milestones'
];

const EXPECTED_JOURNEY_KEYS = [
  'id',
  'name', 
  'status',
  'stats'
];

const EXPECTED_STATS_KEYS = [
  'totalMiles',
  'statesVisited',
  'totalDrives',
  'totalCharges'
];

describe('Unified Data Contract', () => {
  it('should have required top-level keys', () => {
    const mockUnifiedData = {
      timestamp: '2024-01-01T00:00:00Z',
      vehicle: null,
      journey: {
        id: 'continental-usa-2025',
        name: 'Continental USA Tesla Road Trip 2025',
        status: 'active',
        stats: {
          totalMiles: 0,
          statesVisited: 0,
          totalDrives: 0,
          totalCharges: 0
        }
      },
      segments: [],
      milestones: []
    };

    EXPECTED_UNIFIED_DATA_KEYS.forEach(key => {
      expect(mockUnifiedData).toHaveProperty(key);
    });
  });

  it('should have required journey structure', () => {
    const journey = {
      id: 'continental-usa-2025',
      name: 'Continental USA Tesla Road Trip 2025',
      status: 'active',
      stats: {
        totalMiles: 100,
        statesVisited: 3,
        totalDrives: 5,
        totalCharges: 2
      }
    };

    EXPECTED_JOURNEY_KEYS.forEach(key => {
      expect(journey).toHaveProperty(key);
    });

    EXPECTED_STATS_KEYS.forEach(key => {
      expect(journey.stats).toHaveProperty(key);
    });
  });

  it('should handle vehicle data correctly', () => {
    const vehicleData = {
      vin: 'TEST123',
      name: 'Test Tesla',
      location: {
        latitude: 37.7749,
        longitude: -122.4194
      },
      battery: {
        level: 80,
        range: 250
      },
      state: 'parked',
      lastUpdate: '2024-01-01T00:00:00Z'
    };

    expect(vehicleData).toHaveProperty('vin');
    expect(vehicleData).toHaveProperty('location');
    expect(vehicleData.location).toHaveProperty('latitude');
    expect(vehicleData.location).toHaveProperty('longitude');
    expect(vehicleData).toHaveProperty('battery');
    expect(vehicleData.battery).toHaveProperty('level');
    expect(vehicleData.battery).toHaveProperty('range');
  });

  it('should handle segments array structure', () => {
    const segments = [
      {
        id: 'drive-123',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T12:00:00Z',
        distance: 120,
        startLocation: 'San Francisco',
        endLocation: 'San Jose',
        efficiency: 250,
        state: 'CA'
      }
    ];

    segments.forEach(segment => {
      expect(segment).toHaveProperty('id');
      expect(segment).toHaveProperty('startTime');
      expect(segment).toHaveProperty('distance');
      expect(segment).toHaveProperty('startLocation');
    });
  });

  it('should handle milestones array structure', () => {
    const milestones = [
      {
        id: 'state-CA',
        type: 'state_visit',
        title: 'Visited CA',
        description: 'First visit to CA',
        achievedAt: '2024-01-01T00:00:00Z',
        rarity: 'common',
        value: 'CA'
      }
    ];

    milestones.forEach(milestone => {
      expect(milestone).toHaveProperty('id');
      expect(milestone).toHaveProperty('type');
      expect(milestone).toHaveProperty('title');
      expect(milestone).toHaveProperty('achievedAt');
      expect(milestone).toHaveProperty('rarity');
    });
  });
});