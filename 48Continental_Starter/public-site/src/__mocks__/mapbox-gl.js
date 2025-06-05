/* eslint-env node */
// Mock for mapbox-gl in tests

export default {
  accessToken: "",
  Map: class MockMap {
    constructor() {
      // Return the instance itself so map.current works properly
      return this;
    }

    addControl() {
      return this;
    }
    removeControl() {
      return this;
    }
    on() {
      return this;
    }
    off() {
      return this;
    }
    remove() {
      return this;
    }
    addSource() {
      return this;
    }
    removeSource() {
      return this;
    }
    addLayer() {
      return this;
    }
    removeLayer() {
      return this;
    }
    getSource() {
      return null;
    }
    getLayer() {
      return null;
    }
    setStyle() {
      return this;
    }
    flyTo() {
      return this;
    }
    getCanvas() {
      return { style: { cursor: "" } };
    }
  },
  NavigationControl: class MockNavigationControl {},
  FullscreenControl: class MockFullscreenControl {},
  GeolocateControl: class MockGeolocateControl {},
  ScaleControl: class MockScaleControl {},
  Marker: class MockMarker {
    constructor() {
      this.popup = null;
    }
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    setPopup(popup) {
      this.popup = popup;
      return this;
    }
    getPopup() {
      return this.popup;
    }
  },
  Popup: class MockPopup {
    setLngLat() {
      return this;
    }
    setHTML() {
      return this;
    }
    addTo() {
      return this;
    }
  },
};
