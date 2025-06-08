const express = require("express");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Middleware
app.use(express.json());

// Tesla API route
app.post("/api/tesla", (req, res) => {
  const { email, password } = req.body;
  if (
    email === process.env.TESLA_EMAIL &&
    password === process.env.TESLA_PASSWORD
  ) {
    res.json({ message: "Tesla API authenticated successfully!" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Mapbox route
app.get("/api/mapbox", (req, res) => {
  res.json({ token: process.env.MAPBOX_PUBLIC_TOKEN });
});

// Start server
app.listen(port, () => {
  console.log(`MCP Server running on port ${port}`);
});
