import { describe, it, expect } from 'vitest';

// Simple journey intelligence functions for testing
export function calculateMilestones(drives: any[]) {
  const milestones = [];
  const statesVisited = new Set();
  
  for (const drive of drives) {
    if (drive.start_state && !statesVisited.has(drive.start_state)) {
      statesVisited.add(drive.start_state);
      milestones.push({
        type: 'state_visit',
        state: drive.start_state,
        achievedAt: drive.started_at,
        rarity: statesVisited.size <= 5 ? 'common' : 'rare'
      });
    }
  }
  
  return milestones;
}

export function calculateJourneyStats(drives: any[], charges: any[]) {
  const totalMiles = drives.reduce((sum, drive) => sum + (drive.distance_miles || 0), 0);
  const statesVisited = new Set(drives.map(drive => drive.start_state).filter(Boolean)).size;
  
  return {
    totalMiles,
    statesVisited,
    totalDrives: drives.length,
    totalCharges: charges.length
  };
}

describe('Journey Intelligence', () => {
  it('should calculate milestones correctly', () => {
    const drives = [
      { start_state: 'CA', started_at: '2024-01-01T00:00:00Z' },
      { start_state: 'NV', started_at: '2024-01-02T00:00:00Z' },
      { start_state: 'CA', started_at: '2024-01-03T00:00:00Z' }, // duplicate
    ];
    
    const milestones = calculateMilestones(drives);
    
    expect(milestones).toHaveLength(2);
    expect(milestones[0].state).toBe('CA');
    expect(milestones[1].state).toBe('NV');
    expect(milestones[0].rarity).toBe('common');
  });

  it('should calculate journey stats correctly', () => {
    const drives = [
      { start_state: 'CA', distance_miles: 100 },
      { start_state: 'NV', distance_miles: 200 },
      { start_state: 'AZ', distance_miles: 150 },
    ];
    
    const charges = [{ id: 1 }, { id: 2 }];
    
    const stats = calculateJourneyStats(drives, charges);
    
    expect(stats.totalMiles).toBe(450);
    expect(stats.statesVisited).toBe(3);
    expect(stats.totalDrives).toBe(3);
    expect(stats.totalCharges).toBe(2);
  });

  it('should handle empty data gracefully', () => {
    const stats = calculateJourneyStats([], []);
    
    expect(stats.totalMiles).toBe(0);
    expect(stats.statesVisited).toBe(0);
    expect(stats.totalDrives).toBe(0);
    expect(stats.totalCharges).toBe(0);
  });
});