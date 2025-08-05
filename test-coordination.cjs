#!/usr/bin/env node

// Human-Dyad AI Coordination Script
// Tests all 4 Ollama models working together

const http = require("http");

const models = {
  phi3: { name: "phi3:latest", task: "Route Optimization & Map Features" },
  gemma3: { name: "gemma3:4b", task: "Analytics & Data Processing" },
  codellama: { name: "codellama:7b", task: "AI Assistant & Code Generation" },
  mistral: { name: "mistral:latest", task: "UX Enhancement & Social Features" },
};

async function testModel(modelName, prompt, task) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: modelName,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        max_tokens: 100,
      },
    });

    const options = {
      hostname: "localhost",
      port: 11434,
      path: "/api/generate",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve({
            model: modelName,
            task: task,
            success: true,
            response:
              response.response?.substring(0, 50) + "..." ||
              "Response received",
          });
        } catch (error) {
          resolve({
            model: modelName,
            task: task,
            success: false,
            error: error.message,
          });
        }
      });
    });

    req.on("error", (error) => {
      resolve({
        model: modelName,
        task: task,
        success: false,
        error: error.message,
      });
    });

    req.write(postData);
    req.end();
  });
}

async function coordinateAllModels() {
  console.log("🚀 INITIATING HUMAN-DYAD COORDINATION");
  console.log("=".repeat(50));

  const prompts = {
    phi3: "Optimize a Tesla route from San Francisco to Los Angeles considering charging stops and traffic.",
    gemma3:
      "Analyze Tesla journey data: 450 miles, 6.2 hours, 3 charging stops, 89% efficiency. Provide insights.",
    codellama:
      "Generate TypeScript code for a Tesla journey assistant that provides real-time recommendations.",
    mistral:
      "Design UX improvements for a Tesla road trip app focusing on real-time updates and social sharing.",
  };

  const promises = Object.entries(models).map(([key, model]) =>
    testModel(model.name, prompts[key], model.task)
  );

  try {
    const results = await Promise.all(promises);

    console.log("\n🎯 COORDINATION RESULTS:");
    console.log("-".repeat(50));

    results.forEach((result) => {
      const status = result.success ? "✅ ACTIVE" : "❌ ERROR";
      console.log(`${status} ${result.model.toUpperCase()}`);
      console.log(`   Task: ${result.task}`);
      if (result.success) {
        console.log(`   Response: ${result.response}`);
      } else {
        console.log(`   Error: ${result.error}`);
      }
      console.log("");
    });

    const successCount = results.filter((r) => r.success).length;
    const successRate = (successCount / results.length) * 100;

    console.log("📊 COORDINATION SUMMARY:");
    console.log(`   Models Active: ${successCount}/${results.length}`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(
      `   Status: ${
        successRate === 100 ? "🔥 FULL COORDINATION" : "⚠️ PARTIAL COORDINATION"
      }`
    );

    if (successRate === 100) {
      console.log("\n🚀 ALL SYSTEMS GO!");
      console.log("Ready for multi-track Tesla app development!");
      console.log("Human-Dyad coordination established successfully.");
    }
  } catch (error) {
    console.error("❌ Coordination failed:", error.message);
  }
}

// Execute coordination test
coordinateAllModels();
