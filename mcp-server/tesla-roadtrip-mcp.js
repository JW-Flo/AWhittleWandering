#!/usr/bin/env node

/**
 * Tesla Road Trip Tracker MCP Server
 * Provides ChatGPT access to real-time Tesla data and trip analysis
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Tesla API configuration
const TESLA_API_BASE = "https://awhittlewandering-api.kd8jc7v8cd.workers.dev";

class TeslaRoadTripMCP {
  constructor() {
    this.server = new Server(
      {
        name: "tesla-roadtrip-tracker",
        version: "1.0.0",
        description:
          "Access Tesla road trip data for A Whittle Wandering cross-country adventure",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_current_tesla_status",
          description:
            "Get current Tesla vehicle status including battery, location, and charging state",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "get_trip_overview",
          description:
            "Get overall trip statistics including total miles, states visited, and progress",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "search_drives",
          description: "Search driving segments by date, location, or distance",
          inputSchema: {
            type: "object",
            properties: {
              startDate: {
                type: "string",
                description: "Start date filter (YYYY-MM-DD)",
              },
              endDate: {
                type: "string",
                description: "End date filter (YYYY-MM-DD)",
              },
              state: { type: "string", description: "Filter by state" },
              minDistance: {
                type: "number",
                description: "Minimum distance in miles",
              },
              maxDistance: {
                type: "number",
                description: "Maximum distance in miles",
              },
            },
            required: [],
          },
        },
        {
          name: "get_charging_history",
          description: "Get charging session history and analysis",
          inputSchema: {
            type: "object",
            properties: {
              days: {
                type: "number",
                description: "Number of days to look back (default: 30)",
              },
            },
            required: [],
          },
        },
        {
          name: "analyze_efficiency",
          description:
            "Analyze driving efficiency by route, weather, or time period",
          inputSchema: {
            type: "object",
            properties: {
              groupBy: {
                type: "string",
                enum: ["state", "month", "week", "route"],
                description: "How to group the efficiency analysis",
              },
            },
            required: ["groupBy"],
          },
        },
        {
          name: "find_nearby_chargers",
          description:
            "Find charging stations near current location or specified coordinates",
          inputSchema: {
            type: "object",
            properties: {
              latitude: {
                type: "number",
                description: "Latitude (uses current location if not provided)",
              },
              longitude: {
                type: "number",
                description:
                  "Longitude (uses current location if not provided)",
              },
              radius: {
                type: "number",
                description: "Search radius in miles (default: 50)",
              },
              type: {
                type: "string",
                enum: ["supercharger", "destination", "ccs", "all"],
                description: "Type of charger to find",
              },
            },
            required: [],
          },
        },
        {
          name: "plan_route",
          description: "Plan a route with optimal charging stops",
          inputSchema: {
            type: "object",
            properties: {
              destination: {
                type: "string",
                description: "Destination address or city",
              },
              departureTime: {
                type: "string",
                description: "Planned departure time (ISO format)",
              },
              maxChargeStops: {
                type: "number",
                description: "Maximum number of charging stops",
              },
            },
            required: ["destination"],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_current_tesla_status":
            return await this.getCurrentStatus();

          case "get_trip_overview":
            return await this.getTripOverview();

          case "search_drives":
            return await this.searchDrives(args);

          case "get_charging_history":
            return await this.getChargingHistory(args);

          case "analyze_efficiency":
            return await this.analyzeEfficiency(args);

          case "find_nearby_chargers":
            return await this.findNearbyChargers(args);

          case "plan_route":
            return await this.planRoute(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async getCurrentStatus() {
    const response = await fetch(`${TESLA_API_BASE}/api/v1/unified-data`);
    const data = await response.json();

    const status = data.currentStatus;
    const location = status.location;

    return {
      content: [
        {
          type: "text",
          text: `🚗 **Tesla Status Update**

**Battery & Range:**
- Battery Level: ${status.battery.level}%
- Estimated Range: ${status.battery.range} miles
- Charging Status: ${status.battery.charging}

**Current Location:**
- 📍 ${location.city}, ${location.state}
- Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}
- Last Updated: ${new Date(location.lastUpdate).toLocaleString()}

**Vehicle Info:**
- Odometer: ${status.vehicle.odometer.toLocaleString()} miles
- Current Speed: ${status.vehicle.speed} mph
- Inside Temp: ${status.vehicle.temperature.inside}°C
- Outside Temp: ${status.vehicle.temperature.outside}°C`,
        },
      ],
    };
  }

  async getTripOverview() {
    const response = await fetch(`${TESLA_API_BASE}/api/v1/unified-data`);
    const data = await response.json();

    const overview = data.overview;
    const progressPercent = (
      (overview.statesVisited / overview.totalStates) *
      100
    ).toFixed(1);

    return {
      content: [
        {
          type: "text",
          text: `🗺️ **${overview.tripName}**

**Trip Progress:**
- 📅 Started: ${overview.startDate}
- ⏱️ Days Elapsed: ${overview.daysElapsed}
- 🛣️ Total Miles: ${overview.totalMiles.toLocaleString()}
- 🏁 States Visited: ${overview.statesVisited}/${
            overview.totalStates
          } (${progressPercent}%)
- 📊 Current Odometer: ${overview.currentOdometer.toLocaleString()} miles

**Vehicle:** ${overview.vehicle}

This epic cross-country adventure is ${progressPercent}% complete!`,
        },
      ],
    };
  }

  async searchDrives(args) {
    const response = await fetch(`${TESLA_API_BASE}/api/v1/unified-data`);
    const data = await response.json();

    let drives = data.timeline.drives;

    // Apply filters
    if (args.startDate) {
      drives = drives.filter((d) => d.date >= args.startDate);
    }
    if (args.endDate) {
      drives = drives.filter((d) => d.date <= args.endDate);
    }
    if (args.state) {
      drives = drives.filter(
        (d) =>
          d.startLocation.includes(args.state) ||
          d.endLocation.includes(args.state)
      );
    }
    if (args.minDistance) {
      drives = drives.filter((d) => d.distance >= args.minDistance);
    }
    if (args.maxDistance) {
      drives = drives.filter((d) => d.distance <= args.maxDistance);
    }

    const totalDistance = drives.reduce((sum, d) => sum + d.distance, 0);

    return {
      content: [
        {
          type: "text",
          text: `🚙 **Drive Search Results**

Found ${drives.length} drives matching your criteria.
Total Distance: ${totalDistance} miles

**Recent Drives:**
${drives
  .slice(0, 10)
  .map(
    (drive) =>
      `• ${new Date(drive.date).toLocaleDateString()}: ${
        drive.startLocation
      } → ${drive.endLocation} (${drive.distance} mi)`
  )
  .join("\n")}

${drives.length > 10 ? `\n... and ${drives.length - 10} more drives` : ""}`,
        },
      ],
    };
  }

  async getChargingHistory(args) {
    const response = await fetch(`${TESLA_API_BASE}/api/v1/unified-data`);
    const data = await response.json();

    const charges = data.timeline.charges;
    const totalCost = charges.reduce((sum, c) => sum + c.cost, 0);
    const totalEnergy = charges.reduce((sum, c) => sum + c.energyAdded, 0);

    return {
      content: [
        {
          type: "text",
          text: `⚡ **Charging History**

**Summary:**
- Total Charging Sessions: ${charges.length}
- Total Energy Added: ${totalEnergy} kWh
- Total Cost: $${totalCost.toFixed(2)}
- Average Cost per kWh: $${(totalCost / totalEnergy).toFixed(3)}

**Recent Charging Sessions:**
${charges
  .slice(0, 5)
  .map(
    (charge) =>
      `• ${new Date(charge.date).toLocaleDateString()}: ${charge.location}\n  ${
        charge.energyAdded
      } kWh, $${charge.cost}`
  )
  .join("\n\n")}`,
        },
      ],
    };
  }

  async analyzeEfficiency(args) {
    // This would implement detailed efficiency analysis
    return {
      content: [
        {
          type: "text",
          text: `📊 **Efficiency Analysis (${args.groupBy})**

This feature would analyze driving efficiency grouped by ${args.groupBy}.
Implementation would include:
- Miles per kWh by group
- Weather impact analysis
- Route efficiency comparisons
- Charging frequency patterns

[Feature coming soon - needs historical efficiency data]`,
        },
      ],
    };
  }

  async findNearbyChargers(args) {
    // This would integrate with charging network APIs
    return {
      content: [
        {
          type: "text",
          text: `🔌 **Nearby Charging Stations**

Searching within ${args.radius || 50} miles...

[This would integrate with:]
- Tesla Supercharger network API
- PlugShare API
- ChargePoint API
- Electrify America API

[Feature requires charging network API integration]`,
        },
      ],
    };
  }

  async planRoute(args) {
    return {
      content: [
        {
          type: "text",
          text: `🗺️ **Route Planning to ${args.destination}**

[This would provide:]
- Optimal route with charging stops
- Estimated travel time
- Charging stop recommendations
- Weather considerations
- Real-time traffic integration

[Feature requires mapping API integration]`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Tesla Road Trip MCP Server running on stdio");
  }
}

const server = new TeslaRoadTripMCP();
server.run().catch(console.error);
