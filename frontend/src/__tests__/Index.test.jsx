import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "../pages/Landing";
import JourneyerDashboard from "../pages/JourneyerDashboard";

vi.stubGlobal("fetch", vi.fn());

const mockUnifiedData = {
  overview: {
    tripName: "Test Trip",
    vehicle: "Model 3",
    startDate: "2025-01-01",
    daysElapsed: 1,
    totalMiles: 123,
    currentOdometer: 45678,
    statesVisited: 1,
    totalStates: 48,
  },
  currentStatus: {
    battery: { level: 80, range: 240, charging: "charging" },
    location: {
      coordinates: { lat: 37.7749, lng: -122.4194 },
      state: "CA",
      lastUpdate: "2025-01-01T00:00:00Z",
      city: "San Francisco",
    },
    vehicle: { odometer: 45678, speed: 0, temperature: { inside: 21, outside: 18 } },
  },
  timeline: { drives: [], charges: [] },
  tessieStatus: { connected: true, lastUpdate: "2025-01-01T00:00:00Z", dataFreshness: "fresh" },
};

describe("UI/UX surfaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the calm landing with a follower CTA", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    expect(screen.getByText("A Whittle Wandering")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /follow the journey/i })).toBeInTheDocument();
  });

  it("renders journeyer dashboard tabs after data load", async () => {
    fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes("/api/v1/unified-data")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => mockUnifiedData,
        });
      }
      if (u.includes("/api/v1/config")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({
            mapboxToken: null,
            apiBaseUrl: "http://example",
            appName: "Test",
            apiVersion: "1.0.0",
            features: { liveTeslaData: true, mapIntegration: false, realtimeUpdates: true },
            updateInterval: 30000,
          }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({}),
      });
    });

    render(
      <MemoryRouter>
        <JourneyerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/journeyer command center/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("tab", { name: /live/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /author/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /system/i })).toBeInTheDocument();
  });
});

