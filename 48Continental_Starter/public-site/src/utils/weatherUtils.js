// weatherUtils.js
// Utility functions for weather data processing and visualization

function getTemperatureColor(tempF) {
  if (tempF >= 90) return '#e53e3e'; // red
  if (tempF >= 70) return '#ed8936'; // orange
  if (tempF >= 50) return '#f6e05e'; // yellow
  if (tempF >= 32) return '#48bb78'; // green
  return '#4299e1'; // blue
}

function formatAlertDescription(description) {
  if (!description) return '';
  return description.length > 100 ? description.substring(0, 100) + '...' : description;
}

export { getTemperatureColor, formatAlertDescription };
