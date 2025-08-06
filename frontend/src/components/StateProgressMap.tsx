import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { LatLngExpression, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// State data with visit status
interface StateData {
  name: string;
  abbreviation: string;
  visited: boolean;
  visitDate?: string;
  center: [number, number];
}

interface Drive {
  id: number;
  startCoordinates: { lat: number; lng: number };
  endCoordinates: { lat: number; lng: number };
  startLocation: string;
  endLocation: string;
  date: string;
  distance: number;
}

interface StateProgressMapProps {
  drives: Drive[];
  visitedStates: string[];
  currentLocation: { lat: number; lng: number };
  className?: string;
}

const StateProgressMap: React.FC<StateProgressMapProps> = ({
  drives,
  visitedStates,
  currentLocation,
  className = ""
}) => {
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [routeLines, setRouteLines] = useState<LatLngExpression[][]>([]);

  // Continental US states with their center coordinates (memoized)
  const US_STATES: StateData[] = useMemo(() => [
    { name: 'Alabama', abbreviation: 'AL', visited: false, center: [32.806671, -86.791130] },
    { name: 'Arizona', abbreviation: 'AZ', visited: false, center: [33.729759, -111.431221] },
    { name: 'Arkansas', abbreviation: 'AR', visited: false, center: [34.969704, -92.373123] },
    { name: 'California', abbreviation: 'CA', visited: false, center: [36.116203, -119.681564] },
    { name: 'Colorado', abbreviation: 'CO', visited: false, center: [39.059811, -105.311104] },
    { name: 'Connecticut', abbreviation: 'CT', visited: false, center: [41.597782, -72.755371] },
    { name: 'Delaware', abbreviation: 'DE', visited: false, center: [39.318523, -75.507141] },
    { name: 'Florida', abbreviation: 'FL', visited: false, center: [27.766279, -81.686783] },
    { name: 'Georgia', abbreviation: 'GA', visited: false, center: [33.040619, -83.643074] },
    { name: 'Idaho', abbreviation: 'ID', visited: false, center: [44.240459, -114.478828] },
    { name: 'Illinois', abbreviation: 'IL', visited: false, center: [40.349457, -88.986137] },
    { name: 'Indiana', abbreviation: 'IN', visited: false, center: [39.849426, -86.258278] },
    { name: 'Iowa', abbreviation: 'IA', visited: false, center: [42.011539, -93.210526] },
    { name: 'Kansas', abbreviation: 'KS', visited: false, center: [38.526600, -96.726486] },
    { name: 'Kentucky', abbreviation: 'KY', visited: false, center: [37.668140, -84.670067] },
    { name: 'Louisiana', abbreviation: 'LA', visited: false, center: [31.169546, -91.867805] },
    { name: 'Maine', abbreviation: 'ME', visited: false, center: [44.693947, -69.381927] },
    { name: 'Maryland', abbreviation: 'MD', visited: false, center: [39.063946, -76.802101] },
    { name: 'Massachusetts', abbreviation: 'MA', visited: false, center: [42.230171, -71.530106] },
    { name: 'Michigan', abbreviation: 'MI', visited: false, center: [43.326618, -84.536095] },
    { name: 'Minnesota', abbreviation: 'MN', visited: false, center: [45.694454, -93.900192] },
    { name: 'Mississippi', abbreviation: 'MS', visited: false, center: [32.741646, -89.678696] },
    { name: 'Missouri', abbreviation: 'MO', visited: false, center: [38.456085, -92.288368] },
    { name: 'Montana', abbreviation: 'MT', visited: false, center: [47.042418, -109.633835] },
    { name: 'Nebraska', abbreviation: 'NE', visited: false, center: [41.125370, -98.268082] },
    { name: 'Nevada', abbreviation: 'NV', visited: false, center: [38.313515, -117.055374] },
    { name: 'New Hampshire', abbreviation: 'NH', visited: false, center: [43.452492, -71.563896] },
    { name: 'New Jersey', abbreviation: 'NJ', visited: false, center: [40.298904, -74.521011] },
    { name: 'New Mexico', abbreviation: 'NM', visited: false, center: [34.840515, -106.248482] },
    { name: 'New York', abbreviation: 'NY', visited: false, center: [42.165726, -74.948051] },
    { name: 'North Carolina', abbreviation: 'NC', visited: false, center: [35.630066, -79.806419] },
    { name: 'North Dakota', abbreviation: 'ND', visited: false, center: [47.528912, -99.784012] },
    { name: 'Ohio', abbreviation: 'OH', visited: false, center: [40.388783, -82.764915] },
    { name: 'Oklahoma', abbreviation: 'OK', visited: false, center: [35.565342, -96.928917] },
    { name: 'Oregon', abbreviation: 'OR', visited: false, center: [44.572021, -122.070938] },
    { name: 'Pennsylvania', abbreviation: 'PA', visited: false, center: [40.590752, -77.209755] },
    { name: 'Rhode Island', abbreviation: 'RI', visited: false, center: [41.680893, -71.511780] },
    { name: 'South Carolina', abbreviation: 'SC', visited: false, center: [33.856892, -80.945007] },
    { name: 'South Dakota', abbreviation: 'SD', visited: false, center: [44.299782, -99.438828] },
    { name: 'Tennessee', abbreviation: 'TN', visited: false, center: [35.747845, -86.692345] },
    { name: 'Texas', abbreviation: 'TX', visited: false, center: [31.054487, -97.563461] },
    { name: 'Utah', abbreviation: 'UT', visited: false, center: [40.150032, -111.862434] },
    { name: 'Vermont', abbreviation: 'VT', visited: false, center: [44.045876, -72.710686] },
    { name: 'Virginia', abbreviation: 'VA', visited: false, center: [37.769337, -78.169968] },
    { name: 'Washington', abbreviation: 'WA', visited: false, center: [47.400902, -121.490494] },
    { name: 'West Virginia', abbreviation: 'WV', visited: false, center: [38.491226, -80.954570] },
    { name: 'Wisconsin', abbreviation: 'WI', visited: false, center: [44.268543, -89.616508] },
    { name: 'Wyoming', abbreviation: 'WY', visited: false, center: [42.755966, -107.302490] }
  ], []);

  useEffect(() => {
    // Update state visit status based on visitedStates prop
    const updatedStates = US_STATES.map(state => ({
      ...state,
      visited: visitedStates.includes(state.name)
    }));
    setStateData(updatedStates);

    // Generate route lines from drives
    const routes = drives.map(drive => [
      [drive.startCoordinates.lat, drive.startCoordinates.lng] as LatLngExpression,
      [drive.endCoordinates.lat, drive.endCoordinates.lng] as LatLngExpression
    ]);
    setRouteLines(routes);
  }, [visitedStates, drives, US_STATES]);

  // Custom icon for current location
  const createCustomIcon = (color: string, icon: string) => {
    return divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${icon}</div>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const visitedCount = stateData.filter(state => state.visited).length;
  const progressPercentage = (visitedCount / 48) * 100;

  return (
    <div className={`relative ${className}`}>
      {/* Progress Header */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">State Progress</h2>
          <span className="text-lg font-semibold">{visitedCount}/48 States</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 mb-2">
          <div 
            className="bg-white h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-sm opacity-90">
          {progressPercentage.toFixed(1)}% of Continental United States explored
        </p>
      </div>

      {/* Interactive Map */}
      <div className="h-96 lg:h-[500px] rounded-lg overflow-hidden border">
        <MapContainer
          center={[39.8283, -98.5795]} // Center of continental US
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* State Center Markers */}
          {stateData.map((state) => (
            <Marker
              key={state.abbreviation}
              position={state.center}
              icon={createCustomIcon(
                state.visited ? '#10B981' : '#6B7280',
                state.abbreviation
              )}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-bold text-lg">{state.name}</h3>
                  <p className={`text-sm ${state.visited ? 'text-green-600' : 'text-gray-500'}`}>
                    {state.visited ? '✅ Visited' : '⭕ Not Visited'}
                  </p>
                  {state.visitDate && (
                    <p className="text-xs text-gray-600">
                      Visited: {new Date(state.visitDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Current Location */}
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={createCustomIcon('#EF4444', '🚗')}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold">Current Location</h3>
                <p className="text-sm">Tesla Model Y</p>
                <p className="text-xs text-gray-600">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Route Lines */}
          {routeLines.map((route, index) => (
            <Polyline
              key={index}
              positions={route}
              pathOptions={{
                color: '#3B82F6',
                weight: 3,
                opacity: 0.7,
                dashArray: '5, 10'
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* State List */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {stateData.map((state) => (
          <div
            key={state.abbreviation}
            className={`p-2 rounded text-center text-sm transition-all ${
              state.visited
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            <div className="font-semibold">{state.abbreviation}</div>
            <div className="text-xs">{state.name}</div>
            {state.visited && (
              <div className="text-xs text-green-600 mt-1">✅</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StateProgressMap;
