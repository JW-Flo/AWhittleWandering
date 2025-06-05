/* eslint-env node */
// Mock for mapbox-gl in tests
const mockFn = () => {};

export default {
  accessToken: "",
  Map: class MockMap {
    constructor() {
      this.current = {
        addControl: mockFn,
        removeControl: mockFn,
        on: mockFn,
        off: mockFn,
        remove: mockFn,
        addSource: mockFn,
        removeSource: mockFn,
        addLayer: mockFn,
        removeLayer: mockFn,
        getSource: () => null,
        getLayer: () => null,
        setStyle: mockFn,
        flyTo: mockFn,
        getCanvas: () => ({ style: { cursor: "" } }),
      };
    }

    addControl() {}
    removeControl() {}
    on() {}
    off() {}
    remove() {}
    addSource() {}
    removeSource() {}
    addLayer() {}
    removeLayer() {}
    getSource() {
      return null;
    }
    getLayer() {
      return null;
    }
    setStyle() {}
    flyTo() {}
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
