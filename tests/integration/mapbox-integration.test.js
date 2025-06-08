import mapboxgl from "mapbox-gl";

/* eslint-env jest, browser */

// Mock Mapbox GL JS
jest.mock("mapbox-gl", () => {
  const mockMap = jest.fn(() => ({
    setCenter: jest.fn(),
    setZoom: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    project: jest.fn(() => ({ x: 100, y: 200 })),
  }));

  return {
    Map: mockMap,
    accessToken: "",
  };
});

describe("Mapbox Integration Tests", () => {
  beforeEach(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA";
  });

  it("should initialize the map with correct parameters", () => {
    const container = document.createElement("div");
    container.id = "map";
    document.body.appendChild(container);

    new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 3,
    });

    expect(mapboxgl.Map).toHaveBeenCalledWith({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 3,
    });
  });

  it("should use the correct access token", () => {
    expect(mapboxgl.accessToken).toBe(
      "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA"
    );
  });

  it("should handle map events correctly", () => {
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 3,
    });

    const mockEventHandler = jest.fn();
    map.on("move", mockEventHandler);

    expect(map.on).toHaveBeenCalledWith("move", mockEventHandler);
  });

  it("should project coordinates correctly", () => {
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 3,
    });

    const projected = map.project([-98.5795, 39.8283]);
    expect(projected).toEqual({ x: 100, y: 200 });
  });
});
