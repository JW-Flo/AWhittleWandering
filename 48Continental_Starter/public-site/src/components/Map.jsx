/**
 * Map Component
 * 
 * Displays an interactive map of The Wandering Whittle's journey
 * with route, stops, and current vehicle location.
 */

/* eslint-env browser */
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import Hammer from 'hammerjs';
import TripStatistics from './TripStatistics';
import './Map.css';

// Set MapBox token from environment variables
// Using public token (pk.) for client-side application
mapboxgl.amcessTakepx= import.meta.env.VITE_gl.acce impor||.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoidGhld2FuZGVyaW5nd2hpdHRsZSIsImEiOiJjbHQxaXhzejYwYmU2MmpxdHl0MHowN3tn..poducto
  'charging-station': `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="#4CAF50" d="M14.5,11l-1.5,-3h2l3,7h-5v4l-6,-8h3l1.5,-3h3z"/>
    </svg>
  `,
  'lodging': `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="#2196F3" d="M19,7h-8v7H3V5H1v15h2v-3h18v3h2v-9C23,8.79,21.21,7,19,7z M15,13.5A1.5,1.5,0,1,1,16.5,12,1.5,1.5,0,0,1,15,13.5z"/>
    </svg>
  `,
  'waypoint': `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="#FFC107" d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z"/>
    </svg>
  `
};

// Create SVG marker element
const createMarkerElement = (type) => {
  const el = document.createElement('div');
  el.className = `marker-icon marker-${type}`;
  el.innerHTML = SVG_ICONS[type] || SVG_ICONS['waypoint'];
  return el;
};

// Initialize map markers and layers
const initializeMapLayers = async (map, tripData) => {
  if (!map || !tripData) return;

  try {
    // Clear existing layers if they exist
    ['route-line', 'stops-markers'].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    ['route', 'stops'].forEach(sourceId => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });

    // Add route layer
    if (tripData.route?.length > 1) {
      const routeGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: tripData.route
            .filter(point => point.longitude && point.latitude)
            .map(point => [point.longitude, point.latitude])
        }
      };

      map.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#0066cc',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    }

    // Add stops layer
    if (tripData.stops?.length > 0) {
      const stopsGeoJSON = {
        type: 'FeatureCollection',
        features: tripData.stops
          .filter(stop => stop.latitude && stop.longitude)
          .map(stop => ({
            type: 'Feature',
            properties: {
              id: stop.id,
              name: stop.name,
              description: stop.description,
              type: stop.type,
              charging: stop.charging,
              overnight: stop.overnight
            },
            geometry: {
              type: 'Point',
              coordinates: [stop.longitude, stop.latitude]
            }
          }))
      };

      map.addSource('stops', {
        type: 'geojson',
        data: stopsGeoJSON
      });

      // Add markers for each stop
      stopsGeoJSON.features.forEach(stop => {
        const markerType = stop.properties.overnight ? 'lodging' :
          stop.properties.charging ? 'charging-station' : 'waypoint';

        const el = createMarkerElement(markerType);

        new mapboxgl.Marker({
          element: el,
          anchor: 'bottom'
        })
          .setLngLat(stop.geometry.coordinates)
          .setPopup(
            new mapboxgl.Popup({
              offset: 25,
              closeButton: false,
              maxWidth: '300px'
            })
              .setHTML(`
            <div class="map-popup">
              <h4>${stop.properties.name}</h4>
              <p>${stop.properties.description}</p>
              <p class="stop-type">Type: ${stop.properties.type.charAt(0).toUpperCase() + stop.properties.type.slice(1)}</p>
            </div>
          `)
          )
          .addTo(map);
      });
    }
  } catch (error) {
    console.error('Error initializing map layers:', error);
    throw new Error('Failed to initialize map layers');
  }
};

/**
 * Interactive map component using Mapbox GL
 */
const Map = ({
  vehicleData,
  tripData,
  weatherData,
  stationsData,
  fullscreen = false,
  mapLayers = {
    weather: false,
    traffic: false,
    satellite: false,
    chargingStations: false
  }
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const vehicleMarker = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Initialize map on component mount
  useEffect(() => {
    if (map.current) return; // Map already initialized

    if (!mapboxgl.accessToken || mapboxgl.accessToken === 'pk.placeholder') {
      setMapError('Mapbox access token is missing. Plea      return;


      map.current = new mapboxgl.Map({
        container: mapContainer.current,
             center: [-98.5795, 39.8283], // Center of continental US

     
  wpltiono{bottom-left');

      map.current.addControl(new mapboxgl.NavigationControl({
        visualizePitch: true,
        showCompass: true
      }), 'top-right');

      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
         .cuCnwaprial'
      , 'bottom-left');

       Setup touch geiO);

      document.dispatchEvent(new CustomEvent('map:swipe:left'));
      })

      mmer.on('swiperight', () => {
osing side panel
  teu'p.current.on('load', async () => {

 sit
        // Set map as ready
        setMapReady(true);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map layers. Please try refreshing the page.');
        // Still se
le.error('Error initializing map:', error);
      tMapError(error.message);
    }

    // Canup on unmount
    rern () => {
 map.current = null;
    };

// Upde map style based on layer toggles
  useEffect(() => {
  if (apReady || !map.current) return;

  // Sto current view state
   concurrentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();

   // Hae style changes
   constwStyle = mapLayers.satellite
     ?apbox://styles/mapbox/satellite-streets-v11'
mapbox://styles/mapbox/streets-v11';
maewait initializeMapLayers(map.current, tripData);
 async
       rmap.current.setZoom(currentZoom);
      });

      map.cuawart irent.setStyle(newStyle);;
    }}

//Setmapasready
  tRy(tr
    // Hw rs.we ather )&eatherData) {
      consg('Weather overlay would show data:',rData);
    }setMapError('Failedtoinitializemaplayers. Please try}refreshing,the page.');yers, mapReady, weatherData, tripData]);
nd utill spdate charging stations  map
  useEffect(() => {
    if (!
m     });
    } apReady || !map.current) return;
itiizingmp
    //dle chargingetati.message);
o   }

    // Cleasup on unmounl
    return () => {
      af (myp.curret){
        .urrent.remve();
        a.curr = null
    co}
nst };
  }, []);


  souUpdace map styIe based on dayer toggle=
  us Effec'(()c=> {
    if (!harReadyg|| !mip.current)g-sturn;

is // Sto current vew state
    cotcrretCenter = map.urren.getCenter();
    cst currentZoom = mp.current.getZoom();

    //cHandleostylenchanges
st  conlt nawSyyle = mrIL='eas.satglliteg-stations-layer';
?'mapbox://styles/mapbox/satellite-streets-v11'
    //: 'mapbox://styles/mapbox/streets-v11'emove existing layer and source if they exist

    //fOnly  h(nge smyle.if it's diffurent
    if (map.curnent.getStyle(t.name.!== newStyle) getLayer(layerId)) {
      map.murrent.apce('.tyurrl.adm, vsync () => {
        // Re-inieiLaizeyall layers afte( style change
        awaityerId);eMapLayers(.current tripData);

        //Rstoe the pevius view
        map.current.setCenter(currentCente
      }map.current.Zoom(cuentZm);
      });

      map.crrent.setStye(ewSyle);
    }

    //Hadle weaher overly
    f(Layers.weather && weatherData)
      console.log('Weath velay would show data:', wthrData
    if (map.current.getSource(sourceId)) {
  }, [mapLayers, mapReady, weatherData, tripData]);

     Addmcud rrdate charging stationsent the map
 .rseEffect(() => {
    if (!mapReady || !map.cvrreet) reSurn;
ource(sourceId);
    // Handle cha}ging stations layr
    cons sorceId = 'chaging-stations';
    costlayerId'charging-stations-layer';

//Removeexising layeand source if they exist
// Only add the lat.geyLayer(layerId)er if it's enabled and we have data
if (mapLayers.chargingSeLaytralayerIdtions && stationsData?.stations?.length > 0) {
    }

 // ifC(onvert stat.getSource(sourceId)) {
    inmap.currest.removeSource(so rceId) 
    }
GeoJSON
    // Only addctheolayer if it's enabled and we have dypa
    if 'mapLayFes.chaagingStations && stationsData?.stations?.length > 0) {
      // Ctnveut stations to GeoJSON
      const stationsGeoJSON =eC
        type: 'FeatureCollection',ollection',
        features: stationsData.stations.map(station => ({
          type: 'Feature',
          properties: {
            id: station.id,
            name: station.name,
            available: station.available,
            power: station.power,
            connectorType: station.connectorType,
            description: station.description
          },
          geometry: {
            type: 'Point',
            coordinates: [station.longitude, station.latitude]
          }
        }))
      };

      // Add stations source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: stationsGeoJSON
      });

      // Add a symbol layer for stations
      map.current.addLayer({
        id: layerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'icon-image': 'charging-station',
          'icon-size': 1.2,
          'icon-allow-overlap': true,
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-size': 12,
          'text-optional': true
        },
        paint: {
          'text-color': '#333',
          'text-halo-color': '#fff',
          'text-halo-width': 1,
          'icon-color': [
            'case',
            ['get', 'available'],
            '#4CAF50', // Available (green)
            '#F44336'  // Unavailable (red)
          ]
        }
      });

      // Add click handler for stations
      map.current.on('click', layerId, (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { name, available, power, connectorType, description } = e.features[0].properties;

        // Create popup content
        const statusText = available ? 'Available' : 'In Use';
        const statusClass = available ? 'status-available' : 'status-unavailable';

        const popupContent = `
          <div class="map-popup charging-popup">
            <h4>${name}</h4>
            <p>${description || 'Tesla Supercharger'}</p>
            <p class="station-power">Power: ${power || 'Unknown'} kW</p>
            <p class="station-connector">Connector: ${connectorType || 'Tesla'}</p>
            <p class="station-status ${statusClass}">Status: ${statusText}</p>
          </div>
        `;

        // Create popup
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map.current);
      });

      // Change cursor on hover
      map.current.on('mouseenter', layerId, () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', layerId, () => {
        map.current.getCanvas().style.cursor = '';
      });
    }
  }, [mapLayers.chargingStations, stationsData, mapReady]);

  // Update map data when tripData changes
  useEffect(() => {
    if (!mapReady || !map.current) return;

    (async () => {
      try {
        // Re-initialize layers with new data
        await initializeMapLayers(map.current, tripData);
      } catch (error) {
        console.error('Error updating map data:', error);
        setMapError('Failed to update map data');
      }
    })();
  }, [tripData, mapReady]);

  // Add and update vehicle marker
  useEffect(() => {
    if (!mapReady || !map.current || !vehicleData) return;

    // Extract coordinates with proper fallbacks
    const latitude = vehicleData.location?.latitude || vehicleData.latitude;
    const longitude = vehicleData.location?.longitude || vehicleData.longitude;

    if (!latitude || !longitude) return;

    // Function to create/update the vehicle marker
    const updateVehicleMarker = () => {
      try {
        if (!vehicleMarker.current) {
          // Create a vehicle marker element
          const el = document.createElement('div');
          el.className = 'vehicle-marker';

          // Use a better SVG car icon for better visibility
          el.innerHTML = `
            <svg viewBox="0 0 24 24" width="36" height="36" fill="${vehicleData.batteryLevel < 20 ? '#f44336' : '#4CAF50'}">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          `;

          // Add pulse effect if car is moving
          if (vehicleData.speed > 0) {
            el.classList.add('vehicle-moving');
          }

          // Add vehicle marker to map
          vehicleMarker.current = new mapboxgl.Marker({
            element: el,
            anchor: 'center',
            rotation: vehicleData.heading || 0,
            rotationAlignment: 'map'
          })
            .setLngLat([longitude, latitude])
            .addTo(map.current);

          // Add popup for vehicle with better formatting
          const batteryClass = vehicleData.batteryLevel < 20 ? 'battery-low' :
            vehicleData.batteryLevel > 80 ? 'battery-high' : '';

          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
            maxWidth: '300px',
            className: 'vehicle-marker-popup'
          })
            .setHTML(`
              <div class="vehicle-popup">
                <h4>Whittle Wagon</h4>
                <div class="vehicle-popup-stats">
                  <div class="popup-stat">
                    <span class="popup-stat-icon">🔋</span>
                    <span class="popup-stat-value ${batteryClass}">${Math.round(vehicleData.batteryLevel)}%</span>
                  </div>
                  <div class="popup-stat">
                    <span class="popup-stat-icon">⚡</span>
                    <span class="popup-stat-value">${Math.round(vehicleData.range)} mi</span>
                  </div>
                  <div class="popup-stat">
                    <span class="popup-stat-icon">🚀</span>
                    <span class="popup-stat-value">${Math.round(vehicleData.speed)} mph</span>
                  </div>
                </div>
              </div>
            `);

          vehicleMarker.current.setPopup(popup);
        } else {
          // Update marker position and rotation
          vehicleMarker.current.setLngLat([longitude, latitude]);

          // Update rotation if heading is available
          if (vehicleData.heading !== undefined) {
            const markerEl = vehicleMarker.current.getElement();
            vehicleMarker.current.setRotation(vehicleData.heading);

            // Update moving state
            if (vehicleData.speed > 0) {
              markerEl.classList.add('vehicle-moving');
            } else {
              markerEl.classList.remove('vehicle-moving');
            }

            // Update car color based on battery
            const svgPath = markerEl.querySelector('svg');
            if (svgPath) {
              svgPath.style.fill = vehicleData.batteryLevel < 20 ? '#f44336' : '#4CAF50';
            }
          }

          // Update popup content
          if (vehicleMarker.current.getPopup()) {
            const batteryClass = vehicleData.batteryLevel < 20 ? 'battery-low' :
              vehicleData.batteryLevel > 80 ? 'battery-high' : '';

            vehicleMarker.current.getPopup().setHTML(`
              <div class="vehicle-popup">
                <h4>Whittle Wagon</h4>
                <div class="vehicle-popup-stats">
                  <div class="popup-stat">
                    <span class="popup-stat-icon">🔋</span>
                    <span class="popup-stat-value ${batteryClass}">${Math.round(vehicleData.batteryLevel)}%</span>
                  </div>
                  <div class="popup-stat">
                    <span class="popup-stat-icon">⚡</span>
                    <span class="popup-stat-value">${Math.round(vehicleData.range)} mi</span>
                  </div>
                  <div class="popup-stat">
                    <span class="popup-stat-icon">🚀</span>
                    <span class="popup-stat-value">${Math.round(vehicleData.speed)} mph</span>
                  </div>
                </div>
              </div>
            `);
          }
        }
      } catch (error) {
        console.error('Error updating vehicle marker:', error);
      }
    };

    // Try to update the vehicle marker
    updateVehicleMarker();
  }, [vehicleData, mapReady]);

  // Center map on vehicle location when asked
  const centerMapOnVehicle = () => {
    if (!map.current || !vehicleData) return;

    const latitude = vehicleData.location?.latitude || vehicleData.latitude;
    const longitude = vehicleData.location?.longitude || vehicleData.longitude;

    if (!latitude || !longitude) return;

    map.current.flyTo({
      center: [longitude, latitude],
      zoom: 12,
      essential: true
    });
  };

  return (
    <div className={`map-container ${fullscreen ? 'map-fullscreen-mode' : ''}`}>
      {mapError ? (
        <div className="map-error">
          <h3>Error loading map</h3>
          <p>{mapError}</p>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className="map" />

          {/* Trip statistics overlay - only show when not in fullscreen mode */}
          {mapReady && !fullscreen && (
            <TripStatistics
              mapRef={map}
              vehicle={vehicleData}
            />
          )}

          {vehicleData && !fullscreen && (
            <button
              className="center-vehicle-btn"
              onClick={centerMapOnVehicle}
              aria-label="Center map on vehicle"
            >
              <span className="center-icon">🎯</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

Map.propTypes = {
  vehicleData: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    batteryLevel: PropTypes.number,
    range: PropTypes.number,
    speed: PropTypes.number,
    name: PropTypes.string
  }),
  tripData: PropTypes.shape({
    route: PropTypes.arrayOf(
      PropTypes.shape({
        latitude: PropTypes.number,
        longitude: PropTypes.number
      })
    ),
    stops: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        latitude: PropTypes.number,
        longitude: PropTypes.number,
        type: PropTypes.string,
        description: PropTypes.string,
        charging: PropTypes.bool,
        overnight: PropTypes.bool
      })
    )
  }),
  weatherData: PropTypes.object,
  stationsData: PropTypes.shape({
    stations: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        latitude: PropTypes.number,
        longitude: PropTypes.number,
        available: PropTypes.bool,
        power: PropTypes.number,
        connectorType: PropTypes.string,
        description: PropTypes.string
      })
    ),
    radius: PropTypes.number
  }),
  fullscreen: PropTypes.bool,
  mapLayers: PropTypes.shape({
    weather: PropTypes.bool,
    traffic: PropTypes.bool,
    satellite: PropTypes.bool,
    chargingStations: PropTypes.bool
  })
};

export default Map;
