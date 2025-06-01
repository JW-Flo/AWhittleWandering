import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class TripManager {
  static async startTrip() {
    const tripData = {
      startTime: new Date().toISOString(),
      startLocation: await Location.getCurrentPositionAsync({}),
      stops: [],
      energyUsed: 0,
      distance: 0
    };
    
    await AsyncStorage.setItem('current_trip', JSON.stringify(tripData));
    return tripData;
  }

  static async getCurrentTrip() {
    const tripData = await AsyncStorage.getItem('current_trip');
    return tripData ? JSON.parse(tripData) : null;
  }

  static async addStop(stopData) {
    const currentTrip = await this.getCurrentTrip();
    if (currentTrip) {
      currentTrip.stops.push({
        ...stopData,
        timestamp: new Date().toISOString()
      });
      await AsyncStorage.setItem('current_trip', JSON.stringify(currentTrip));
    }
    return currentTrip;
  }

  static async endTrip() {
    const currentTrip = await this.getCurrentTrip();
    if (currentTrip) {
      currentTrip.endTime = new Date().toISOString();
      currentTrip.endLocation = await Location.getCurrentPositionAsync({});
      
      // Save to trip history
      const historyStr = await AsyncStorage.getItem('trip_history') || '[]';
      const history = JSON.parse(historyStr);
      history.push(currentTrip);
      await AsyncStorage.setItem('trip_history', JSON.stringify(history));
      
      // Clear current trip
      await AsyncStorage.removeItem('current_trip');
    }
    return currentTrip;
  }

  static async getTripHistory() {
    const historyStr = await AsyncStorage.getItem('trip_history') || '[]';
    return JSON.parse(historyStr);
  }

  static calculateEnergyUsage(startCharge, endCharge, batteryCapacity = 100) {
    return (startCharge - endCharge) * batteryCapacity / 100;
  }

  static async updateTripStats(batteryLevel, location) {
    const currentTrip = await this.getCurrentTrip();
    if (currentTrip) {
      // Update energy usage
      if (!currentTrip.lastBatteryLevel) {
        currentTrip.lastBatteryLevel = batteryLevel;
      }
      
      // Update distance
      if (currentTrip.lastLocation) {
        const distance = await Location.distanceBetweenAsync(
          currentTrip.lastLocation.coords,
          location.coords
        );
        currentTrip.distance += distance;
      }
      
      currentTrip.lastLocation = location;
      currentTrip.lastBatteryLevel = batteryLevel;
      
      await AsyncStorage.setItem('current_trip', JSON.stringify(currentTrip));
    }
    return currentTrip;
  }
}
