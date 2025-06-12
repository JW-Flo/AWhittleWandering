"use strict";

const express = require("express");
const router = express.Router();

// Import MCP handlers
const mapService = require("../services/map.service");
const weatherService = require("../services/weather.service");

/**
 * MCP Server Information
 * This endpoint provides metadata about the server and available tools
 */
router.get("/", (req, res) => {
  res.json({
    name: "48 Continental USA MCP Server",
    version: "1.0.0",
    description:
      "MCP server for 48 Continental USA project with map and weather services",
    servers: [
      {
        name: "map-agent",
        description:
          "MapBox Specialist Agent for route optimization and map rendering",
        tools: Object.keys(mapService).map((toolName) => ({
          name: toolName,
          description: mapService[toolName].description,
        })),
      },
      {
        name: "weather-agent",
        description:
          "Weather API Specialist Agent for weather data and forecasting",
        tools: Object.keys(weatherService).map((toolName) => ({
          name: toolName,
          description: weatherService[toolName].description,
        })),
      },
    ],
  });
});

/**
 * Map Service Tool Discovery
 */
router.get("/map-agent", (req, res) => {
  const mapTools = Object.keys(mapService).map((toolName) => ({
    name: toolName,
    description: mapService[toolName].description,
    parameters: mapService[toolName].parameters,
  }));

  res.json({
    name: "MapBox Specialist Agent",
    description:
      "Specialized agent for handling all map rendering, route optimization, and map interactions",
    version: "1.0.0",
    tools: mapTools,
  });
});

/**
 * Weather Service Tool Discovery
 */
router.get("/weather-agent", (req, res) => {
  const weatherTools = Object.keys(weatherService).map((toolName) => ({
    name: toolName,
    description: weatherService[toolName].description,
    parameters: weatherService[toolName].parameters,
  }));

  res.json({
    name: "Weather API Specialist Agent",
    description:
      "Specialized agent for weather data integration, forecasting, and route weather analysis",
    version: "1.0.0",
    tools: weatherTools,
  });
});

/**
 * Map Service Tool Execution
 */
router.post("/map-agent/:toolName", async (req, res) => {
  try {
    const { toolName } = req.params;
    const toolArgs = req.body;

    if (!mapService[toolName]) {
      return res.status(404).json({
        error: {
          message: `Tool '${toolName}' not found in map service`,
          status: 404,
        },
      });
    }

    const result = await mapService[toolName].handler(toolArgs);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: {
        message: error.message,
        status: 500,
      },
    });
  }
});

/**
 * Weather Service Tool Execution
 */
router.post("/weather-agent/:toolName", async (req, res) => {
  try {
    const { toolName } = req.params;
    const toolArgs = req.body;

    if (!weatherService[toolName]) {
      return res.status(404).json({
        error: {
          message: `Tool '${toolName}' not found in weather service`,
          status: 404,
        },
      });
    }

    const result = await weatherService[toolName].handler(toolArgs);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: {
        message: error.message,
        status: 500,
      },
    });
  }
});

module.exports = router;
