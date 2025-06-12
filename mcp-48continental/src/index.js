"use strict";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const winston = require("winston");

// Import routes
const mapRoutes = require("./routes/map.routes");
const weatherRoutes = require("./routes/weather.routes");
const mcpRoutes = require("./routes/mcp.routes");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3100;

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// Set up middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Basic authentication middleware
const authMiddleware = require("./middlewares/auth.middleware");

// Register routes
app.use("/api/map", authMiddleware, mapRoutes);
app.use("/api/weather", authMiddleware, weatherRoutes);
app.use("/mcp", mcpRoutes); // MCP protocol endpoints

// Status endpoint
app.get("/api/status", (req, res) => {
  res.status(200).json({
    status: "OK",
    version: process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  );

  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500,
    },
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`MCP 48Continental server listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  // Perform graceful shutdown
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Perform graceful shutdown
  process.exit(1);
});

module.exports = app; // For testing purposes
