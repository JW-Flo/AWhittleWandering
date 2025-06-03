/**
 * Weather Display Component
 * 
 * Displays current weather conditions and forecast for the
 * current location during the 48 Continental USA journey.
 */

/* eslint-env browser */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Weather display component
 */
const WeatherDisplay = ({ weatherData }) => {
  if (!weatherData) {
    return (
      <div className="no-data-message">
        <p>Weather data not available</p>
      </div>
    );
  }
  
  const { 
    temperature, 
    feelsLike, 
    condition, 
    icon, 
    humidity, 
    windSpeed, 
    windDirection,
    precipitation,
    sunrise,
    sunset,
    forecast,
    location,
    last_updated
  } = weatherData;
  
  // Format sunrise/sunset times
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format the last updated time
  const formattedUpdateTime = last_updated 
    ? new Date(last_updated).toLocaleString() 
    : 'Unknown';
  
  // Convert wind direction degrees to cardinal direction
  const getWindDirection = (degrees) => {
    if (degrees === undefined) return 'N/A';
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
    const index = Math.round(degrees / 22.5);
    return directions[index];
  };
  
  return (
    <div className="weather-display">
      {/* Current Weather Overview */}
      <div className="current-weather">
        <div className="weather-main">
          <div className="weather-icon-temp">
            {icon && (
              <img 
                src={`https://openweathermap.org/img/wn/${icon}@2x.png`} 
                alt={condition} 
                className="weather-icon-large"
              />
            )}
            <div className="temperature-display">
              <span className="current-temp">{Math.round(temperature)}°F</span>
              <span className="feels-like">Feels like {Math.round(feelsLike)}°F</span>
            </div>
          </div>
          <div className="condition-location">
            <h3 className="condition">{condition}</h3>
            {location && (
              <p className="location">{location.name || 'Current Location'}</p>
            )}
          </div>
        </div>
        
        {/* Weather Details */}
        <div className="weather-details">
          <div className="detail-item">
            <span className="detail-icon">💧</span>
            <span className="detail-label">Humidity</span>
            <span className="detail-value">{humidity}%</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-icon">💨</span>
            <span className="detail-label">Wind</span>
            <span className="detail-value">{windSpeed} mph {getWindDirection(windDirection)}</span>
          </div>
          
          {precipitation && (
            <div className="detail-item">
              <span className="detail-icon">🌧️</span>
              <span className="detail-label">Precipitation</span>
              <span className="detail-value">{Math.round(precipitation.probability * 100)}%</span>
            </div>
          )}
        </div>
        
        {/* Sun Times */}
        <div className="sun-times">
          <div className="sun-item">
            <span className="sun-icon">🌅</span>
            <span className="sun-label">Sunrise</span>
            <span className="sun-value">{formatTime(sunrise)}</span>
          </div>
          
          <div className="sun-item">
            <span className="sun-icon">🌇</span>
            <span className="sun-label">Sunset</span>
            <span className="sun-value">{formatTime(sunset)}</span>
          </div>
        </div>
      </div>
      
      {/* Forecast */}
      {forecast && forecast.length > 0 && (
        <div className="forecast-section">
          <h3>5-Day Forecast</h3>
          <div className="forecast-container">
            {forecast.map((day, index) => (
              <div className="forecast-day" key={index}>
                <span className="day-name">{day.day}</span>
                <div className="day-temps">
                  <span className="high-temp">{Math.round(day.temperature.high)}°</span>
                  <span className="low-temp">{Math.round(day.temperature.low)}°</span>
                </div>
                <span className="day-condition">{day.condition}</span>
                <span className="day-precip">{Math.round(day.precipitation)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Last updated */}
      <div className="last-updated">
        Last updated: {formattedUpdateTime}
      </div>
    </div>
  );
};

WeatherDisplay.propTypes = {
  weatherData: PropTypes.shape({
    temperature: PropTypes.number,
    feelsLike: PropTypes.number,
    condition: PropTypes.string,
    icon: PropTypes.string,
    humidity: PropTypes.number,
    windSpeed: PropTypes.number,
    windDirection: PropTypes.number,
    precipitation: PropTypes.shape({
      probability: PropTypes.number,
      intensity: PropTypes.number
    }),
    sunrise: PropTypes.string,
    sunset: PropTypes.string,
    forecast: PropTypes.arrayOf(
      PropTypes.shape({
        day: PropTypes.string,
        temperature: PropTypes.shape({
          high: PropTypes.number,
          low: PropTypes.number
        }),
        condition: PropTypes.string,
        precipitation: PropTypes.number
      })
    ),
    location: PropTypes.shape({
      latitude: PropTypes.number,
      longitude: PropTypes.number,
      name: PropTypes.string
    }),
    last_updated: PropTypes.string
  })
};

export default WeatherDisplay;
