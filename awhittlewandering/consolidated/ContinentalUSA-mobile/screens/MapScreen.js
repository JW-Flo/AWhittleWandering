import React, { useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { FAB, Overlay, Text } from '@rneui/themed';

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#242f3e"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#746855"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#242f3e"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{"color": "#38414e"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{"color": "#212a37"}]
  }
];

export default function MapScreen() {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const superchargers = [
    {
      id: 1,
      title: "Kettleman City Supercharger",
      coordinate: {
        latitude: 36.0085,
        longitude: -119.9632
      },
      details: {
        available: "8/12 stalls",
        waitTime: "No wait",
        power: "250kW"
      }
    },
    {
      id: 2,
      title: "Harris Ranch Supercharger",
      coordinate: {
        latitude: 36.2543,
        longitude: -120.2375
      },
      details: {
        available: "6/8 stalls",
        waitTime: "5 min",
        power: "150kW"
      }
    }
  ];

  const route = [
    { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
    { latitude: 36.0085, longitude: -119.9632 }, // Kettleman City
    { latitude: 34.0522, longitude: -118.2437 }  // Los Angeles
  ];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: 36.7783,
          longitude: -119.4179,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
      >
        <Polyline
          coordinates={route}
          strokeColor="#2196F3"
          strokeWidth={3}
        />
        
        {superchargers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            onPress={() => {
              setSelectedMarker(marker);
              setShowOverlay(true);
            }}
          />
        ))}
      </MapView>

      <FAB
        style={styles.fab}
        icon={{ name: 'navigation', type: 'material-community', color: 'white' }}
        color="#2196F3"
        onPress={() => {/* Navigate to current location */}}
      />

      <Overlay
        isVisible={showOverlay}
        onBackdropPress={() => setShowOverlay(false)}
        overlayStyle={styles.overlay}
      >
        {selectedMarker && (
          <View>
            <Text style={styles.overlayTitle}>{selectedMarker.title}</Text>
            <Text style={styles.overlayDetail}>Available: {selectedMarker.details.available}</Text>
            <Text style={styles.overlayDetail}>Wait Time: {selectedMarker.details.waitTime}</Text>
            <Text style={styles.overlayDetail}>Power: {selectedMarker.details.power}</Text>
          </View>
        )}
      </Overlay>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  overlay: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  overlayTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  overlayDetail: {
    color: '#BBBBBB',
    fontSize: 16,
    marginVertical: 5,
  },
});
