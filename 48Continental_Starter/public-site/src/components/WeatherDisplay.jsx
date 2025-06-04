/**
 * Weather Display Component
 * 
 * Displays current weather information along The Wandering Whittle's route.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { 
  FaTemperatureHigh, 
  FaWind, 
  FaCloudRain, 
  FaSun, 
  FaCloud, 
  FaCloudSun,
  FaSnowflake,
  FaBolt,
  FaSmog
} from 'react-icons/fa';

/**
 * Get the appropriate weather icon based on the condition
 */
const getWeatherIcon = (condition) => {
  if (!condition) return <FaCloudSun size={32} />;
  
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
    return <FaSun size={32} />;
  } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <FaCloud size={32} />;
  } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('shower')) {
    return <FaCloudRain size={32} />;
  } else if (lowerCondition.includes('snow') || lowerCondition.includes('sleet') || lowerCondition.includes('ice')) {
    return <FaSnowflake size={32} />;
  } else if (lowerCondition.includes('thunder') || lowerCondition.includes('lightning') || lowerCondition.includes('storm')) {
    return <FaBolt size={32} />;
  } else if (lowerCondition.includes('fog') || lowerCondition.includes('mist') || lowerCondition.includes('haze')) {
    return <FaSmog size={32} />;
  } else {
    return <FaCloudSun size={32} />;
  }
};

/**
 * Weather Display component
 */
const WeatherDisplay = ({ weatherData }) => {
  if (!weatherData) {
    return (
      <div className="weather-display">
        <div className="no-data-message">No weather data available</div>
      </div>
    );
  }

  const {
    temperature,
    condition,
    feelsLike,
    humidity,
    windSpeed,
    windDirection,
    precipitation
  } = weatherData;

  return (
    <div className="weather-display">
      <div className="weather-icon">
        {getWeatherIcon(condition)}
      </div>
      
      <div className="weather-temp">
        {temperature !== undefined ? `${Math.round(temperature)}°F` : 'N/A'}
      </div>
      
      <div className="weather-condition">
        {condition || 'Weather data unavailable'}
      </div>
      
      <div className="weather-details">
        <div className="weather-detail-item">
          <div className="detail-label">
            <FaTemperatureHigh size={12} style={{ marginRight: '4px' }} />
            FEELS LIKE
          </div>
          <div className="detail-value">
            {feelsLike !== undefined ? `${Math.round(feelsLike)}°F` : 'N/A'}
          </div>
        </div>
        
        <div className="weather-detail-item">
          <div className="detail-label">
            <FaCloudRain size={12} style={{ marginRight: '4px' }} />
            HUMIDITY
          </div>
          <div className="detail-value">
            {humidity !== undefined ? `${humidity}%` : 'N/A'}
          </div>
        </div>
        
        <div className="weather-detail-item">
          <div className="detail-label">
            <FaWind size={12} style={{ marginRight: '4px' }} />
            WIND
          </div>
          <div className="detail-value">
            {windSpeed !== undefined ? `${windSpeed} mph` : 'N/A'}
            {windDirection ? ` from ${windDirection}` : ''}
          </div>
        </div>
        
        <div className="weather-detail-item">
          <div className="detail-label">
            <FaCloudRain size={12} style={{ marginRight: '4px' }} />
            PRECIP
          </div>
          <div className="detail-value">
            {precipitation !== undefined ? `${precipitation}%` : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

WeatherDisplay.propTypes = {
  weatherData: PropTypes.shape({
    temperature: PropTypes.number,
    condition: PropTypes.string,
    feelsLike: PropTypes.number,
    humidity: PropTypes.number,
    windSpeed: PropTypes.number,
    windDirection: PropTypes.string,
    precipitation: PropTypes.number
  })
};

export default WeatherDisplay;
