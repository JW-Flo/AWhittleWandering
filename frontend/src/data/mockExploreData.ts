export interface ExploreWaypoint {
  date: string;
  lat: number;
  lng: number;
  label: string;
}

export interface ExploreData {
  title: string;
  subtitle: string;
  stats: {
    featuresUnlocked: boolean;
    views: number;
    visitors: number;
  };
  timeline: {
    startDate: string;
    endDate: string;
    waypoints: ExploreWaypoint[];
  };
}

export const mockExploreData: ExploreData = {
  title: "Explore AWW Journey",
  subtitle: "48-state Tesla road trip \u2022 June \u2013 August 2025",
  stats: {
    featuresUnlocked: true,
    views: 37,
    visitors: 16,
  },
  timeline: {
    startDate: "2025-06-03",
    endDate: "2025-08-24",
    waypoints: [
      { date: "2025-06-03", lat: 38.9072, lng: -77.0369, label: "Washington, DC" },
      { date: "2025-06-05", lat: 39.9526, lng: -75.1652, label: "Philadelphia, PA" },
      { date: "2025-06-08", lat: 40.7128, lng: -74.006, label: "New York, NY" },
      { date: "2025-06-11", lat: 41.8781, lng: -87.6298, label: "Chicago, IL" },
      { date: "2025-06-15", lat: 44.9778, lng: -93.265, label: "Minneapolis, MN" },
      { date: "2025-06-19", lat: 46.8772, lng: -96.7898, label: "Fargo, ND" },
      { date: "2025-06-22", lat: 47.6062, lng: -122.3321, label: "Seattle, WA" },
      { date: "2025-06-26", lat: 45.5152, lng: -122.6784, label: "Portland, OR" },
      { date: "2025-06-30", lat: 37.7749, lng: -122.4194, label: "San Francisco, CA" },
      { date: "2025-07-04", lat: 34.0522, lng: -118.2437, label: "Los Angeles, CA" },
      { date: "2025-07-08", lat: 33.4484, lng: -112.074, label: "Phoenix, AZ" },
      { date: "2025-07-11", lat: 35.0844, lng: -106.6504, label: "Albuquerque, NM" },
      { date: "2025-07-14", lat: 32.7555, lng: -97.3308, label: "Fort Worth, TX" },
      { date: "2025-07-18", lat: 29.7604, lng: -95.3698, label: "Houston, TX" },
      { date: "2025-07-21", lat: 30.2672, lng: -97.7431, label: "Austin, TX" },
      { date: "2025-07-24", lat: 29.9511, lng: -90.0715, label: "New Orleans, LA" },
      { date: "2025-07-28", lat: 33.749, lng: -84.388, label: "Atlanta, GA" },
      { date: "2025-08-01", lat: 35.2271, lng: -80.8431, label: "Charlotte, NC" },
      { date: "2025-08-05", lat: 36.1627, lng: -86.7816, label: "Nashville, TN" },
      { date: "2025-08-09", lat: 39.7392, lng: -104.9903, label: "Denver, CO" },
      { date: "2025-08-13", lat: 40.7608, lng: -111.891, label: "Salt Lake City, UT" },
      { date: "2025-08-17", lat: 43.6187, lng: -116.2146, label: "Boise, ID" },
      { date: "2025-08-20", lat: 46.8797, lng: -110.3626, label: "Helena, MT" },
      { date: "2025-08-24", lat: 44.068, lng: -114.742, label: "Stanley, ID" },
    ],
  },
};
