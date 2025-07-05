# Plugin Development Guide

This guide provides detailed information on developing plugins for the Cloudflare-based MCP Server. Plugins are the primary way to extend the functionality of the MCP Server, allowing it to integrate with various external services and APIs.

## Table of Contents

1. [Plugin System Overview](#plugin-system-overview)
2. [Plugin Interface](#plugin-interface)
3. [Creating a New Plugin](#creating-a-new-plugin)
4. [Tool Definition](#tool-definition)
5. [Plugin Registration](#plugin-registration)
6. [Example Implementations](#example-implementations)
   - [Map Plugin](#map-plugin)
   - [Weather Plugin](#weather-plugin)
7. [Testing Plugins](#testing-plugins)
8. [Best Practices](#best-practices)

## Plugin System Overview

The MCP Server's plugin system allows for modular extension of functionality. Each plugin provides a set of tools that can be discovered and executed by AI assistants like ChatGPT. The plugin system consists of:

1. **Plugin Interface**: Defines the contract that all plugins must implement.
2. **Plugin Manager**: Manages plugin registration, discovery, and lifecycle.
3. **Tool Definitions**: Define the tools provided by each plugin, including parameters and return values.
4. **Execution Context**: Provides context for tool execution, including authentication and configuration.

## Plugin Interface

All plugins must implement the `Plugin` interface, which defines the contract between the plugin and the MCP Server.

```typescript
// src/core/plugins/types.ts
export interface Plugin {
  // Metadata
  getName(): string;
  getVersion(): string;
  getDescription(): string;
  
  // Tool Discovery
  getTools(): ToolDefinition[];
  
  // Tool Execution
  executeTool(toolName: string, parameters: any): Promise<any>;
  
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ParameterDefinition[];
  returns?: ReturnDefinition;
}

export interface ParameterDefinition {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
}

export interface ReturnDefinition {
  type: string;
  description: string;
}
```

## Creating a New Plugin

To create a new plugin, follow these steps:

1. Create a new directory in the `src/plugins` directory for your plugin.
2. Create a new class that implements the `Plugin` interface.
3. Implement all required methods.
4. Register the plugin with the plugin manager.

Here's a basic template for a new plugin:

```typescript
// src/plugins/example/index.ts
import { Plugin, ToolDefinition } from '../../core/plugins/types';

export class ExamplePlugin implements Plugin {
  private name = 'example';
  private version = '1.0.0';
  private description = 'An example plugin';
  
  // Metadata
  getName(): string {
    return this.name;
  }
  
  getVersion(): string {
    return this.version;
  }
  
  getDescription(): string {
    return this.description;
  }
  
  // Tool Discovery
  getTools(): ToolDefinition[] {
    return [
      {
        name: 'helloWorld',
        description: 'Returns a greeting message',
        parameters: [
          {
            name: 'name',
            type: 'string',
            description: 'The name to greet',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'A greeting message'
        }
      }
    ];
  }
  
  // Tool Execution
  async executeTool(toolName: string, parameters: any): Promise<any> {
    switch (toolName) {
      case 'helloWorld':
        return this.helloWorld(parameters.name);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
  
  // Lifecycle
  async initialize(): Promise<void> {
    // Initialize the plugin
    console.log('Initializing ExamplePlugin');
  }
  
  async shutdown(): Promise<void> {
    // Clean up resources
    console.log('Shutting down ExamplePlugin');
  }
  
  // Tool Implementations
  private helloWorld(name: string): any {
    return {
      message: `Hello, ${name}!`
    };
  }
}
```

## Tool Definition

Each plugin must provide a list of tools that it offers. Each tool is defined by:

1. **Name**: A unique identifier for the tool.
2. **Description**: A human-readable description of what the tool does.
3. **Parameters**: The input parameters that the tool accepts.
4. **Returns**: The return value of the tool.

```typescript
// Example tool definition
{
  name: 'getCurrentWeather',
  description: 'Gets the current weather for a location',
  parameters: [
    {
      name: 'location',
      type: 'object',
      description: 'The location to get weather for',
      required: true,
      properties: {
        latitude: {
          type: 'number',
          description: 'The latitude of the location',
          required: true
        },
        longitude: {
          type: 'number',
          description: 'The longitude of the location',
          required: true
        }
      }
    }
  ],
  returns: {
    type: 'object',
    description: 'The current weather conditions'
  }
}
```

## Plugin Registration

Plugins must be registered with the plugin manager before they can be used. This is typically done during server startup.

```typescript
// src/index.ts
import { PluginManager } from './core/plugins';
import { ExamplePlugin } from './plugins/example';
import { MapPlugin } from './plugins/map';
import { WeatherPlugin } from './plugins/weather';

async function setupPlugins(): Promise<void> {
  const pluginManager = PluginManager.getInstance();
  
  // Register plugins
  await pluginManager.registerPlugin(new ExamplePlugin());
  await pluginManager.registerPlugin(new MapPlugin());
  await pluginManager.registerPlugin(new WeatherPlugin());
  
  // Initialize plugins
  await pluginManager.initializePlugins();
}

// Call setupPlugins during server initialization
addEventListener('fetch', (event) => {
  // Setup plugins first time only
  if (!pluginsInitialized) {
    setupPlugins();
    pluginsInitialized = true;
  }
  
  event.respondWith(handleRequest(event.request));
});
```

## Example Implementations

### Map Plugin

Here's an example implementation of a Map Plugin that integrates with the MapBox API.

```typescript
// src/plugins/map/index.ts
import { Plugin, ToolDefinition } from '../../core/plugins/types';
import { getMapboxToken } from './config';
import { optimizeRoute, renderMapLayer, getPointsOfInterest } from './mapbox-api';

export class MapPlugin implements Plugin {
  private name = 'map-agent';
  private version = '1.0.0';
  private description = 'MapBox Specialist Agent for route optimization and map rendering';
  private mapboxToken: string;
  
  // Metadata
  getName(): string {
    return this.name;
  }
  
  getVersion(): string {
    return this.version;
  }
  
  getDescription(): string {
    return this.description;
  }
  
  // Tool Discovery
  getTools(): ToolDefinition[] {
    return [
      {
        name: 'optimizeRoute',
        description: 'Optimizes a route between multiple waypoints',
        parameters: [
          {
            name: 'waypoints',
            type: 'array',
            description: 'Array of waypoints to optimize',
            required: true,
            items: {
              type: 'object',
              properties: {
                latitude: {
                  type: 'number',
                  description: 'The latitude of the waypoint',
                  required: true
                },
                longitude: {
                  type: 'number',
                  description: 'The longitude of the waypoint',
                  required: true
                },
                name: {
                  type: 'string',
                  description: 'The name of the waypoint',
                  required: false
                }
              }
            }
          },
          {
            name: 'options',
            type: 'object',
            description: 'Route optimization options',
            required: false,
            properties: {
              mode: {
                type: 'string',
                description: 'Travel mode (driving, walking, cycling)',
                required: false,
                default: 'driving',
                enum: ['driving', 'walking', 'cycling']
              }
            }
          }
        ],
        returns: {
          type: 'object',
          description: 'Optimized route information'
        }
      },
      {
        name: 'renderMapLayer',
        description: 'Renders a map layer with various features',
        parameters: [
          // Map layer parameters
        ],
        returns: {
          type: 'string',
          description: 'URL to the rendered map layer'
        }
      },
      {
        name: 'getPointsOfInterest',
        description: 'Finds points of interest near a location',
        parameters: [
          // POI parameters
        ],
        returns: {
          type: 'array',
          description: 'Points of interest near the location'
        }
      }
    ];
  }
  
  // Tool Execution
  async executeTool(toolName: string, parameters: any): Promise<any> {
    switch (toolName) {
      case 'optimizeRoute':
        return this.optimizeRoute(parameters.waypoints, parameters.options);
      case 'renderMapLayer':
        return this.renderMapLayer(parameters);
      case 'getPointsOfInterest':
        return this.getPointsOfInterest(parameters);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
  
  // Lifecycle
  async initialize(): Promise<void> {
    // Get MapBox API token
    this.mapboxToken = await getMapboxToken();
    console.log('Initialized MapPlugin');
  }
  
  async shutdown(): Promise<void> {
    console.log('Shutting down MapPlugin');
  }
  
  // Tool Implementations
  private async optimizeRoute(waypoints: any[], options: any): Promise<any> {
    return optimizeRoute(this.mapboxToken, waypoints, options);
  }
  
  private async renderMapLayer(parameters: any): Promise<string> {
    return renderMapLayer(this.mapboxToken, parameters);
  }
  
  private async getPointsOfInterest(parameters: any): Promise<any[]> {
    return getPointsOfInterest(this.mapboxToken, parameters);
  }
}
```

### Weather Plugin

Here's an example implementation of a Weather Plugin that integrates with a weather API.

```typescript
// src/plugins/weather/index.ts
import { Plugin, ToolDefinition } from '../../core/plugins/types';
import { getWeatherApiKey } from './config';
import { getCurrentWeather, getWeatherForecast, getWeatherAlerts, analyzeRouteWeather } from './weather-api';

export class WeatherPlugin implements Plugin {
  private name = 'weather-agent';
  private version = '1.0.0';
  private description = 'Weather API Specialist Agent for weather data and forecasting';
  private apiKey: string;
  
  // Metadata
  getName(): string {
    return this.name;
  }
  
  getVersion(): string {
    return this.version;
  }
  
  getDescription(): string {
    return this.description;
  }
  
  // Tool Discovery
  getTools(): ToolDefinition[] {
    return [
      {
        name: 'getCurrentWeather',
        description: 'Gets the current weather for a location',
        parameters: [
          {
            name: 'location',
            type: 'object',
            description: 'The location to get weather for',
            required: true,
            properties: {
              latitude: {
                type: 'number',
                description: 'The latitude of the location',
                required: true
              },
              longitude: {
                type: 'number',
                description: 'The longitude of the location',
                required: true
              }
            }
          }
        ],
        returns: {
          type: 'object',
          description: 'The current weather conditions'
        }
      },
      // Other tool definitions
    ];
  }
  
  // Tool Execution
  async executeTool(toolName: string, parameters: any): Promise<any> {
    switch (toolName) {
      case 'getCurrentWeather':
        return this.getCurrentWeather(parameters.location);
      case 'getWeatherForecast':
        return this.getWeatherForecast(parameters.location, parameters.days);
      case 'getWeatherAlerts':
        return this.getWeatherAlerts(parameters.location);
      case 'analyzeRouteWeather':
        return this.analyzeRouteWeather(parameters.route);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
  
  // Lifecycle
  async initialize(): Promise<void> {
    // Get Weather API key
    this.apiKey = await getWeatherApiKey();
    console.log('Initialized WeatherPlugin');
  }
  
  async shutdown(): Promise<void> {
    console.log('Shutting down WeatherPlugin');
  }
  
  // Tool Implementations
  private async getCurrentWeather(location: any): Promise<any> {
    return getCurrentWeather(this.apiKey, location);
  }
  
  private async getWeatherForecast(location: any, days: number): Promise<any> {
    return getWeatherForecast(this.apiKey, location, days);
  }
  
  private async getWeatherAlerts(location: any): Promise<any> {
    return getWeatherAlerts(this.apiKey, location);
  }
  
  private async analyzeRouteWeather(route: any): Promise<any> {
    return analyzeRouteWeather(this.apiKey, route);
  }
}
```

## Testing Plugins

Plugins should be thoroughly tested to ensure they work correctly. Here's a basic testing approach:

1. **Unit Tests**: Test individual tool implementations.
2. **Integration Tests**: Test the plugin's integration with external APIs.
3. **End-to-End Tests**: Test the plugin within the context of the MCP Server.

```typescript
// src/plugins/example/example.test.ts
import { ExamplePlugin } from './index';

describe('ExamplePlugin', () => {
  let plugin: ExamplePlugin;
  
  beforeEach(() => {
    plugin = new ExamplePlugin();
  });
  
  describe('Metadata', () => {
    it('should return the correct name', () => {
      expect(plugin.getName()).toBe('example');
    });
    
    it('should return the correct version', () => {
      expect(plugin.getVersion()).toBe('1.0.0');
    });
    
    it('should return the correct description', () => {
      expect(plugin.getDescription()).toBe('An example plugin');
    });
  });
  
  describe('Tool Discovery', () => {
    it('should return the correct tools', () => {
      const tools = plugin.getTools();
      expect(tools.length).toBe(1);
      expect(tools[0].name).toBe('helloWorld');
    });
  });
  
  describe('Tool Execution', () => {
    it('should execute the helloWorld tool correctly', async () => {
      const result = await plugin.executeTool('helloWorld', { name: 'Test' });
      expect(result.message).toBe('Hello, Test!');
    });
    
    it('should throw an error for unknown tools', async () => {
      await expect(plugin.executeTool('unknownTool', {})).rejects.toThrow('Unknown tool: unknownTool');
    });
  });
});
```

## Best Practices

When developing plugins for the MCP Server, follow these best practices:

1. **Single Responsibility**: Each plugin should have a single, clear responsibility.
2. **Clear Documentation**: Document your plugin thoroughly, including tool descriptions and parameter details.
3. **Error Handling**: Handle errors gracefully and provide clear error messages.
4. **API Rate Limiting**: Respect API rate limits when integrating with external services.
5. **Caching**: Implement caching where appropriate to improve performance.
6. **Configuration**: Make your plugin configurable through environment variables or configuration files.
7. **Testing**: Write comprehensive tests for your plugin.
8. **Security**: Handle sensitive information securely, such as API keys.
9. **Versioning**: Version your plugin and provide backward compatibility.
10. **Performance**: Optimize your plugin for performance, especially for frequently used tools.

By following these guidelines, you can create robust, maintainable plugins that extend the functionality of the MCP Server in a modular way.
