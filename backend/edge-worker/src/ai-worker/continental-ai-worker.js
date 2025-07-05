/**
 * 48 Continental AI Worker
 * 
 * This worker provides AI capabilities for the 48 Continental project using Cloudflare Workers AI.
 * It exposes OpenAI-compatible endpoints and specialized functions for Tesla route optimization,
 * charging strategy, travel content generation, and environmental impact analysis.
 */

/* global URL, Response, crypto */

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // OpenAI-compatible endpoints
      if (url.pathname === "/v1/chat/completions") {
        return handleChatCompletions(request, env);
      }
      
      if (url.pathname === "/v1/embeddings") {
        return handleEmbeddings(request, env);
      }
      
      // 48 Continental specialized endpoints
      if (url.pathname === "/route-optimization") {
        return handleRouteOptimization(request, env);
      }
      
      if (url.pathname === "/charging-strategy") {
        return handleChargingStrategy(request, env);
      }
      
      if (url.pathname === "/travel-highlights") {
        return handleTravelHighlights(request, env);
      }
      
      if (url.pathname === "/environmental-impact") {
        return handleEnvironmentalImpact(request, env);
      }
      
      // Return 404 for unknown endpoints
      return new Response("Not found", { status: 404 });
    } catch (error) {
      // Handle any uncaught errors
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }
  }
};

/**
 * Handles OpenAI-compatible chat completions endpoint
 */
async function handleChatCompletions(request, env) {
  const body = await request.json();
  
  // Extract parameters with defaults
  const { 
    messages, 
    model = "@cf/meta/llama-3.1-8b-instruct", 
    stream = false,
    temperature = 0.7,
    max_tokens = 1024
  } = body;
  
  try {
    // Construct a proper prompt from the messages
    const prompt = formatMessagesToPrompt(messages);
    
    // Run the model using Workers AI binding
    const response = await env.AI.run(model, {
      prompt,
      stream,
      max_tokens,
      temperature
    });
    
    if (stream) {
      // Return streaming response
      return new Response(response, {
        headers: { "content-type": "text/event-stream" }
      });
    } else {
      // Format response like OpenAI's API
      return new Response(JSON.stringify({
        id: crypto.randomUUID(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: response
          },
          finish_reason: "stop"
        }],
        usage: {
          prompt_tokens: calculateApproximateTokens(prompt),
          completion_tokens: calculateApproximateTokens(response),
          total_tokens: calculateApproximateTokens(prompt) + calculateApproximateTokens(response)
        }
      }), {
        headers: { "content-type": "application/json" }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}

/**
 * Handles OpenAI-compatible embeddings endpoint
 */
async function handleEmbeddings(request, env) {
  const body = await request.json();
  
  // Extract parameters with defaults
  const { 
    input, 
    model = "@cf/baai/bge-large-en-v1.5"
  } = body;
  
  try {
    // Handle both single string and array of strings
    const inputs = Array.isArray(input) ? input : [input];
    const embeddings = [];
    
    // Process each input
    for (const text of inputs) {
      const embedding = await env.AI.run(model, { text });
      embeddings.push(embedding);
    }
    
    // Format response like OpenAI's API
    return new Response(JSON.stringify({
      object: "list",
      data: embeddings.map((embedding, i) => ({
        object: "embedding",
        embedding,
        index: i
      })),
      model,
      usage: {
        prompt_tokens: calculateApproximateTokens(inputs.join(" ")),
        total_tokens: calculateApproximateTokens(inputs.join(" "))
      }
    }), {
      headers: { "content-type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}

/**
 * Handles Tesla route optimization requests
 */
async function handleRouteOptimization(request, env) {
  const { waypoints, constraints, vehicleData } = await request.json();
  
  // Construct a detailed prompt for the model
  const prompt = `You are a Tesla route optimization AI for the 48 Continental USA road trip project.
  
Optimize this Tesla road trip route through these waypoints: 
${JSON.stringify(waypoints, null, 2)}

Considering these constraints: 
${JSON.stringify(constraints, null, 2)}

And this vehicle data:
${JSON.stringify(vehicleData, null, 2)}

Provide the optimized route as a JSON array with the following format:
[
  {
    "location": "City, State",
    "coordinates": {"lat": 00.0000, "lng": -00.0000},
    "estimatedArrival": "YYYY-MM-DD HH:MM",
    "estimatedDeparture": "YYYY-MM-DD HH:MM",
    "chargingStop": true/false,
    "chargingDuration": 30, // minutes, if applicable
    "poi": ["Point of Interest 1", "Point of Interest 2"] // optional
  }
]`;
  
  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { 
    prompt,
    temperature: 0.2, // Lower temperature for more deterministic results
    max_tokens: 2048
  });
  
  try {
    // Try to parse the response as JSON
    const parsedResponse = JSON.parse(response.replace(/```json|```/g, '').trim());
    return new Response(JSON.stringify({ result: parsedResponse }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    // If parsing fails, return the raw response
    return new Response(JSON.stringify({ result: response, note: "Failed to parse as JSON" }), {
      headers: { "content-type": "application/json" }
    });
  }
}

/**
 * Handles Tesla charging strategy recommendations
 */
async function handleChargingStrategy(request, env) {
  const { routeSegment, batteryStatus, weather, timeConstraints } = await request.json();
  
  const prompt = `You are a Tesla charging strategy AI for the 48 Continental USA road trip project.
  
Based on the following route segment, battery status, weather conditions, and time constraints, 
recommend the optimal Tesla charging strategy:

Route Segment: ${JSON.stringify(routeSegment, null, 2)}
Battery Status: ${JSON.stringify(batteryStatus, null, 2)}
Weather Conditions: ${JSON.stringify(weather, null, 2)}
Time Constraints: ${JSON.stringify(timeConstraints, null, 2)}

Format the response as a JSON object with the following format:
{
  "recommendedChargingStops": [
    {
      "location": "Supercharger Name, City, State",
      "coordinates": {"lat": 00.0000, "lng": -00.0000},
      "estimatedArrival": "YYYY-MM-DD HH:MM",
      "chargingDuration": 30, // minutes
      "targetChargeLevel": 80, // percentage
      "estimatedDeparture": "YYYY-MM-DD HH:MM"
    }
  ],
  "totalChargingTime": 45, // minutes
  "estimatedEnergyUsage": 60, // kWh
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;
  
  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { 
    prompt,
    temperature: 0.3,
    max_tokens: 1024
  });
  
  try {
    // Try to parse the response as JSON
    const parsedResponse = JSON.parse(response.replace(/```json|```/g, '').trim());
    return new Response(JSON.stringify({ result: parsedResponse }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    // If parsing fails, return the raw response
    return new Response(JSON.stringify({ result: response, note: "Failed to parse as JSON" }), {
      headers: { "content-type": "application/json" }
    });
  }
}

/**
 * Handles travel highlights and points of interest recommendations
 */
async function handleTravelHighlights(request, env) {
  const { location, preferences, radius, limit } = await request.json();
  
  const prompt = `You are a travel highlights AI for the 48 Continental USA road trip project.
  
Suggest interesting travel highlights and points of interest near ${location} 
within a ${radius || 30} mile radius that match these preferences: 
${JSON.stringify(preferences, null, 2)}

Limit the results to ${limit || 5} highlights.

Format the response as a JSON array with the following format:
[
  {
    "name": "Point of Interest Name",
    "description": "Brief description of the highlight",
    "type": "Historical Site/Natural Wonder/Museum/etc",
    "estimatedTimeNeeded": 60, // minutes
    "coordinates": {"lat": 00.0000, "lng": -00.0000}, // if known
    "openingHours": "9AM-5PM", // if applicable
    "entryFee": "$10", // if applicable
    "tips": ["Tip 1", "Tip 2"]
  }
]`;
  
  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { 
    prompt,
    temperature: 0.7, // Higher temperature for more creative results
    max_tokens: 1500
  });
  
  try {
    // Try to parse the response as JSON
    const parsedResponse = JSON.parse(response.replace(/```json|```/g, '').trim());
    return new Response(JSON.stringify({ result: parsedResponse }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    // If parsing fails, return the raw response
    return new Response(JSON.stringify({ result: response, note: "Failed to parse as JSON" }), {
      headers: { "content-type": "application/json" }
    });
  }
}

/**
 * Handles environmental impact assessment
 */
async function handleEnvironmentalImpact(request, env) {
  const { drivingData, vehicleSpecs, comparisonVehicle } = await request.json();
  
  const prompt = `You are an environmental impact AI for the 48 Continental USA Tesla road trip project.
  
Analyze the environmental impact of this driving segment based on the data: 
${JSON.stringify(drivingData, null, 2)}

With vehicle specifications: 
${JSON.stringify(vehicleSpecs, null, 2)}

Compare with this conventional vehicle (if provided):
${comparisonVehicle ? JSON.stringify(comparisonVehicle, null, 2) : "No comparison vehicle provided"}

Format the response as a JSON object with the following format:
{
  "totalCO2Saved": 100, // kg, compared to gasoline vehicle
  "energyConsumption": 25, // kWh/100miles
  "equivalentMetrics": {
    "treesSaved": 5,
    "gasGallonsSaved": 20
  },
  "environmentalFactors": {
    "terrainImpact": "Low/Medium/High",
    "weatherImpact": "Low/Medium/High",
    "speedImpact": "Low/Medium/High"
  },
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;
  
  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { 
    prompt,
    temperature: 0.4,
    max_tokens: 1024
  });
  
  try {
    // Try to parse the response as JSON
    const parsedResponse = JSON.parse(response.replace(/```json|```/g, '').trim());
    return new Response(JSON.stringify({ result: parsedResponse }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    // If parsing fails, return the raw response
    return new Response(JSON.stringify({ result: response, note: "Failed to parse as JSON" }), {
      headers: { "content-type": "application/json" }
    });
  }
}

/**
 * Helper function to format chat messages into a prompt
 */
function formatMessagesToPrompt(messages) {
  let prompt = "";
  
  for (const message of messages) {
    if (message.role === "system") {
      prompt += `System: ${message.content}\n\n`;
    } else if (message.role === "user") {
      prompt += `User: ${message.content}\n\n`;
    } else if (message.role === "assistant") {
      prompt += `Assistant: ${message.content}\n\n`;
    }
  }
  
  prompt += "Assistant: ";
  return prompt;
}

/**
 * Helper function to calculate approximate token count
 * This is a very rough estimate (4 chars ~= 1 token)
 */
function calculateApproximateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
