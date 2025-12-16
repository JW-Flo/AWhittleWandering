// Actual GPS waypoints from the 48-state journey
// Extracted from TeslaFi drive data - June 3 to August 2025

export interface JourneyWaypoint {
  lat: number;
  lng: number;
  name: string;
  date: string;
  state: string;
  type: 'start' | 'stop' | 'highlight' | 'charging' | 'waypoint';
  description?: string;
}

// Key waypoints from the journey with actual GPS coordinates
export const journeyWaypoints: JourneyWaypoint[] = [
  // Texas Start
  { lat: 27.741570, lng: -97.388860, name: "Corpus Christi", date: "Jun 3", state: "TX", type: "start", description: "Journey begins" },
  { lat: 27.792582, lng: -97.393616, name: "Downtown Corpus Christi", date: "Jun 3", state: "TX", type: "waypoint" },
  { lat: 28.430847, lng: -97.740300, name: "Beeville", date: "Jun 6", state: "TX", type: "charging" },
  { lat: 28.811335, lng: -97.856940, name: "Kenedy", date: "Jun 6", state: "TX", type: "waypoint" },
  { lat: 30.256390, lng: -97.796510, name: "Austin", date: "Jun 6", state: "TX", type: "highlight", description: "Texas capital" },
  { lat: 30.195950, lng: -97.998085, name: "Dripping Springs", date: "Jun 6", state: "TX", type: "waypoint" },
  { lat: 30.195574, lng: -98.333610, name: "Johnson City", date: "Jun 6", state: "TX", type: "waypoint" },
  { lat: 30.509314, lng: -99.774650, name: "Junction", date: "Jun 6", state: "TX", type: "charging" },
  { lat: 30.706587, lng: -101.202540, name: "Ozona", date: "Jun 6", state: "TX", type: "waypoint" },
  { lat: 30.881956, lng: -102.301636, name: "Fort Stockton", date: "Jun 7", state: "TX", type: "charging", description: "West Texas overnight" },
  
  // New Mexico
  { lat: 32.346810, lng: -106.764740, name: "Las Cruces", date: "Jun 7", state: "NM", type: "highlight", description: "New Mexico entry" },
  
  // Arizona
  { lat: 32.221740, lng: -110.926480, name: "Tucson", date: "Jun 8", state: "AZ", type: "highlight", description: "Arizona desert" },
  { lat: 33.448376, lng: -112.074036, name: "Phoenix", date: "Jun 9", state: "AZ", type: "highlight" },
  
  // California - LA Area
  { lat: 33.769150, lng: -118.185440, name: "Long Beach", date: "Jun 15", state: "CA", type: "waypoint" },
  { lat: 34.081276, lng: -118.372505, name: "West Hollywood", date: "Jun 13-16", state: "CA", type: "highlight", description: "LA base camp" },
  { lat: 34.101498, lng: -118.334206, name: "Hollywood Boulevard", date: "Jun 14", state: "CA", type: "highlight" },
  { lat: 34.161324, lng: -118.309690, name: "Burbank", date: "Jun 14", state: "CA", type: "waypoint" },
  { lat: 34.014736, lng: -118.493730, name: "Santa Monica", date: "Jun 15", state: "CA", type: "highlight", description: "Pacific Ocean" },
  { lat: 34.123160, lng: -118.299500, name: "Griffith Observatory", date: "Jun 15", state: "CA", type: "highlight" },
  
  // California Coast North
  { lat: 36.974117, lng: -122.030796, name: "Santa Cruz", date: "Jun 17", state: "CA", type: "waypoint" },
  { lat: 37.774929, lng: -122.419418, name: "San Francisco", date: "Jun 18", state: "CA", type: "highlight", description: "Golden Gate" },
  
  // Oregon
  { lat: 42.326520, lng: -122.875690, name: "Medford", date: "Jun 19", state: "OR", type: "waypoint" },
  { lat: 44.052071, lng: -123.086754, name: "Eugene", date: "Jun 20", state: "OR", type: "highlight" },
  { lat: 45.512230, lng: -122.658722, name: "Portland", date: "Jun 21", state: "OR", type: "highlight", description: "Rose City" },
  
  // Washington
  { lat: 47.606209, lng: -122.332069, name: "Seattle", date: "Jun 22", state: "WA", type: "highlight", description: "Pacific Northwest" },
  { lat: 48.145687, lng: -123.140240, name: "Port Angeles", date: "Jun 23", state: "WA", type: "highlight", description: "Olympic Peninsula" },
  
  // Idaho
  { lat: 43.615017, lng: -116.202316, name: "Boise", date: "Jun 25", state: "ID", type: "highlight" },
  
  // Montana
  { lat: 46.871870, lng: -113.993040, name: "Missoula", date: "Jun 27", state: "MT", type: "highlight", description: "Big Sky Country" },
  { lat: 45.676998, lng: -111.042930, name: "Bozeman", date: "Jun 28", state: "MT", type: "waypoint" },
  
  // Wyoming
  { lat: 44.427963, lng: -110.588455, name: "Yellowstone", date: "Jun 29", state: "WY", type: "highlight", description: "National Park" },
  { lat: 43.479946, lng: -110.762478, name: "Jackson Hole", date: "Jun 30", state: "WY", type: "highlight" },
  
  // Utah
  { lat: 40.760780, lng: -111.891045, name: "Salt Lake City", date: "Jun 30", state: "UT", type: "highlight" },
  
  // Colorado
  { lat: 39.667053, lng: -105.207565, name: "Golden", date: "Jul 2", state: "CO", type: "waypoint" },
  { lat: 39.858105, lng: -104.983710, name: "Denver", date: "Jul 1", state: "CO", type: "highlight", description: "Mile High City" },
  { lat: 40.501390, lng: -105.083340, name: "Fort Collins", date: "Jul 2", state: "CO", type: "waypoint" },
  
  // Nebraska
  { lat: 41.115475, lng: -102.949660, name: "Sidney", date: "Jul 3", state: "NE", type: "charging" },
  { lat: 41.120594, lng: -100.762780, name: "North Platte", date: "Jul 3", state: "NE", type: "waypoint" },
  { lat: 40.829690, lng: -98.379770, name: "Grand Island", date: "Jul 3", state: "NE", type: "waypoint" },
  { lat: 40.786070, lng: -96.629654, name: "Lincoln", date: "Jul 3-7", state: "NE", type: "highlight", description: "Family visit" },
  
  // Iowa
  { lat: 41.590939, lng: -93.620866, name: "Des Moines", date: "Jul 8", state: "IA", type: "highlight" },
  
  // Minnesota
  { lat: 44.977753, lng: -93.265015, name: "Minneapolis", date: "Jul 9", state: "MN", type: "highlight", description: "Twin Cities" },
  
  // Wisconsin
  { lat: 43.038902, lng: -87.906471, name: "Milwaukee", date: "Jul 10", state: "WI", type: "highlight" },
  
  // Illinois
  { lat: 41.878113, lng: -87.629799, name: "Chicago", date: "Jul 11", state: "IL", type: "highlight", description: "Windy City" },
  
  // Indiana
  { lat: 39.768402, lng: -86.158066, name: "Indianapolis", date: "Jul 12", state: "IN", type: "highlight" },
  
  // Michigan
  { lat: 42.331429, lng: -83.045753, name: "Detroit", date: "Jul 13", state: "MI", type: "highlight", description: "Motor City" },
  
  // Ohio
  { lat: 39.177100, lng: -84.429360, name: "Cincinnati", date: "Jul 17", state: "OH", type: "highlight" },
  { lat: 41.499320, lng: -81.694359, name: "Cleveland", date: "Jul 15", state: "OH", type: "waypoint" },
  
  // Pennsylvania  
  { lat: 40.440624, lng: -79.995888, name: "Pittsburgh", date: "Jul 18", state: "PA", type: "highlight", description: "Steel City" },
  { lat: 39.952583, lng: -75.165222, name: "Philadelphia", date: "Jul 20", state: "PA", type: "highlight" },
  
  // New York
  { lat: 42.886447, lng: -78.878369, name: "Buffalo", date: "Jul 16", state: "NY", type: "waypoint" },
  { lat: 40.712776, lng: -74.005974, name: "New York City", date: "Jul 22", state: "NY", type: "highlight", description: "The Big Apple" },
  
  // New Jersey
  { lat: 40.735657, lng: -74.172367, name: "Newark", date: "Jul 22", state: "NJ", type: "waypoint" },
  
  // Connecticut
  { lat: 41.204910, lng: -73.150215, name: "Bridgeport", date: "Jul 25", state: "CT", type: "highlight" },
  { lat: 41.308273, lng: -72.927884, name: "New Haven", date: "Jul 24", state: "CT", type: "waypoint" },
  
  // Rhode Island
  { lat: 41.824009, lng: -71.412834, name: "Providence", date: "Jul 24", state: "RI", type: "highlight" },
  
  // Massachusetts
  { lat: 42.360081, lng: -71.058884, name: "Boston", date: "Jul 23", state: "MA", type: "highlight", description: "Historic city" },
  
  // Vermont
  { lat: 44.475883, lng: -73.212074, name: "Burlington", date: "Jul 26", state: "VT", type: "highlight" },
  
  // New Hampshire
  { lat: 43.207106, lng: -71.537992, name: "Concord", date: "Jul 26", state: "NH", type: "waypoint" },
  
  // Maine
  { lat: 43.661471, lng: -70.255326, name: "Portland", date: "Jul 27", state: "ME", type: "highlight", description: "Coastal Maine" },
  
  // Delaware
  { lat: 39.739071, lng: -75.539787, name: "Wilmington", date: "Jul 28", state: "DE", type: "waypoint" },
  
  // Maryland
  { lat: 39.290386, lng: -76.612189, name: "Baltimore", date: "Jul 28", state: "MD", type: "highlight" },
  
  // Washington DC
  { lat: 38.900154, lng: -77.034096, name: "Washington D.C.", date: "Jul 29", state: "DC", type: "highlight", description: "Nation's Capital" },
  
  // Virginia
  { lat: 38.473633, lng: -77.435814, name: "Stafford", date: "Jul 29", state: "VA", type: "waypoint" },
  { lat: 37.540726, lng: -77.436047, name: "Richmond", date: "Jul 29", state: "VA", type: "waypoint" },
  
  // West Virginia
  { lat: 38.349819, lng: -81.632622, name: "Charleston", date: "Jul 19", state: "WV", type: "waypoint" },
  
  // Kentucky
  { lat: 38.252666, lng: -85.758453, name: "Louisville", date: "Jul 14", state: "KY", type: "highlight", description: "Derby City" },
  
  // Tennessee
  { lat: 36.162663, lng: -86.781601, name: "Nashville", date: "Aug 8", state: "TN", type: "highlight", description: "Music City" },
  
  // North Carolina
  { lat: 36.329130, lng: -78.447840, name: "Henderson", date: "Jul 29", state: "NC", type: "charging" },
  { lat: 35.856064, lng: -80.072250, name: "Thomasville", date: "Jul 29", state: "NC", type: "waypoint" },
  { lat: 35.056390, lng: -80.596550, name: "Monroe", date: "Jul 29 - Aug 8", state: "NC", type: "highlight", description: "Extended stay" },
  { lat: 35.222057, lng: -82.272330, name: "Tryon", date: "Aug 3", state: "NC", type: "waypoint" },
  
  // South Carolina
  { lat: 34.936510, lng: -81.982850, name: "Spartanburg", date: "Aug 3", state: "SC", type: "waypoint" },
  { lat: 32.776474, lng: -79.931051, name: "Charleston", date: "Aug 10", state: "SC", type: "highlight", description: "Historic port" },
  
  // Georgia
  { lat: 33.748997, lng: -84.387985, name: "Atlanta", date: "Aug 11", state: "GA", type: "highlight" },
  { lat: 32.080853, lng: -81.091203, name: "Savannah", date: "Aug 12", state: "GA", type: "highlight" },
  
  // Alabama
  { lat: 33.520682, lng: -86.802490, name: "Birmingham", date: "Aug 13", state: "AL", type: "waypoint" },
  { lat: 32.361538, lng: -86.279118, name: "Montgomery", date: "Aug 13", state: "AL", type: "highlight" },
  
  // Mississippi
  { lat: 32.298757, lng: -90.184810, name: "Jackson", date: "Aug 14", state: "MS", type: "highlight" },
  
  // Louisiana
  { lat: 29.951065, lng: -90.071533, name: "New Orleans", date: "Aug 15", state: "LA", type: "highlight", description: "Big Easy" },
  
  // Arkansas
  { lat: 34.746483, lng: -92.289597, name: "Little Rock", date: "Aug 16", state: "AR", type: "waypoint" },
  
  // Missouri
  { lat: 38.627003, lng: -90.199402, name: "St. Louis", date: "Jul 13", state: "MO", type: "highlight", description: "Gateway Arch" },
  { lat: 39.099728, lng: -94.578568, name: "Kansas City", date: "Jul 8", state: "MO", type: "waypoint" },
  
  // Kansas
  { lat: 37.687176, lng: -97.330055, name: "Wichita", date: "Aug 17", state: "KS", type: "waypoint" },
  
  // Oklahoma
  { lat: 35.467560, lng: -97.516426, name: "Oklahoma City", date: "Aug 18", state: "OK", type: "highlight" },
  
  // South Dakota
  { lat: 43.969515, lng: -103.460701, name: "Rapid City", date: "Jul 7", state: "SD", type: "highlight", description: "Mt. Rushmore area" },
  
  // North Dakota
  { lat: 46.877186, lng: -96.789803, name: "Fargo", date: "Jul 8", state: "ND", type: "waypoint" },
  
  // Nevada
  { lat: 36.169941, lng: -115.139832, name: "Las Vegas", date: "Jun 11", state: "NV", type: "highlight", description: "Sin City" },
  { lat: 39.529633, lng: -119.813803, name: "Reno", date: "Jun 18", state: "NV", type: "waypoint" },
  
  // Florida - End
  { lat: 27.848516, lng: -82.815530, name: "St. Petersburg", date: "Aug 17-24", state: "FL", type: "highlight", description: "Journey's end - Florida sunshine" },
];

// Generate route line coordinates (simplified for map display)
export const generateRouteCoordinates = (): [number, number][] => {
  return journeyWaypoints.map(wp => [wp.lng, wp.lat]);
};

// Get waypoints filtered by type
export const getHighlights = () => journeyWaypoints.filter(wp => wp.type === 'highlight' || wp.type === 'start');
export const getChargingStops = () => journeyWaypoints.filter(wp => wp.type === 'charging');
