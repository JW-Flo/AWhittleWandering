// Temperature conversion utilities for A Whittle Wandering
// Tessie API returns temperatures in Celsius, we need Fahrenheit for US display

/**
 * Convert Celsius to Fahrenheit
 * @param celsius Temperature in Celsius
 * @returns Temperature in Fahrenheit, rounded to 1 decimal place
 */
export const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round((celsius * 9/5 + 32) * 10) / 10;
};

/**
 * Convert Fahrenheit to Celsius
 * @param fahrenheit Temperature in Fahrenheit 
 * @returns Temperature in Celsius, rounded to 1 decimal place
 */
export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return Math.round(((fahrenheit - 32) * 5/9) * 10) / 10;
};

/**
 * Format temperature for display with proper unit
 * @param tempCelsius Temperature in Celsius from Tessie API
 * @param unit Display unit ('F' or 'C')
 * @returns Formatted temperature string
 */
export const formatTemperature = (tempCelsius: number | undefined, unit: 'F' | 'C' = 'F'): string => {
  if (tempCelsius === undefined || tempCelsius === null) return '--°F';
  
  if (unit === 'F') {
    return `${celsiusToFahrenheit(tempCelsius)}°F`;
  } else {
    return `${Math.round(tempCelsius * 10) / 10}°C`;
  }
};

/**
 * Get numeric temperature value for calculations
 * @param tempCelsius Temperature in Celsius from Tessie API
 * @param unit Return unit ('F' or 'C')
 * @returns Numeric temperature value
 */
export const getTemperatureValue = (tempCelsius: number | undefined, unit: 'F' | 'C' = 'F'): number | undefined => {
  if (tempCelsius === undefined || tempCelsius === null) return undefined;
  
  return unit === 'F' ? celsiusToFahrenheit(tempCelsius) : tempCelsius;
};
