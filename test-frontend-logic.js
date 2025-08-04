// Test the frontend logic with sample data
const data = {
  overview: { daysElapsed: 64, totalMiles: 13958, startDate: '2025-06-01' },
  currentStatus: { 
    location: { 
      coordinates: { lat: 35.05639, lng: -80.59656 },
      state: 'Unknown'
    } 
  },
  timeline: { 
    drives: [
      { 
        date: '2025-07-20T08:00:00Z', 
        endLocation: 'Watch Hill Point (coastal visit), Rhode Island',
        distance: 64
      }
    ] 
  }
};

// Test our improved location parsing logic
const parseLocation = (locationString) => {
  if (!locationString) return { city: 'Unknown', state: 'Unknown' };
  
  // Remove prefix if exists (Start:, End:, etc.)
  let cleanLocation = locationString.replace(/^(Start:|End:)\s*/, '');
  
  // Split by comma and get the last part as state
  const parts = cleanLocation.split(', ');
  if (parts.length >= 2) {
    // Last part should contain the state
    const statePart = parts[parts.length - 1].trim();
    
    // Handle multi-word states like "Rhode Island", "New York", etc.
    const knownStates = new Set([
      'Rhode Island', 'New York', 'New Hampshire', 'New Jersey', 'New Mexico',
      'North Carolina', 'North Dakota', 'South Carolina', 'South Dakota', 
      'West Virginia', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
      'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
      'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
      'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
      'Missouri', 'Montana', 'Nebraska', 'Nevada', 'Ohio', 'Oklahoma', 'Oregon',
      'Pennsylvania', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
      'Washington', 'Wisconsin', 'Wyoming'
    ]);
    
    // Check if the full last part is a known state
    let state = statePart;
    if (!knownStates.has(statePart)) {
      // Try first word if full part isn't a known state
      state = statePart.split(' ')[0];
    }
    
    // Second to last part is usually city/region
    const city = parts[parts.length - 2].trim();
    
    return { city, state };
  }
  
  return { city: 'Unknown', state: 'Unknown' };
};

console.log('=== Testing Updated Frontend Logic ===');
console.log('Parse location test:', parseLocation('Watch Hill Point (coastal visit), Rhode Island'));
console.log('Parse location test 2:', parseLocation('Bar Harbor, Cadillac Mountain (sunrise hike), Maine'));
console.log('Parse location test 3:', parseLocation('Stratford stay with Deanna, Connecticut'));
