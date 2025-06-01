import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://owner-api.teslamotors.com/api/1';

export class TeslaAPI {
  static async authenticate(email, password) {
    try {
      const response = await axios.post(`${BASE_URL}/oauth/token`, {
        grant_type: 'password',
        client_id: 'ownerapi',
        client_secret: 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3',
        email,
        password
      });
      
      await AsyncStorage.setItem('tesla_token', response.data.access_token);
      return response.data;
    } catch (error) {
      console.error('Tesla authentication error:', error);
      throw error;
    }
  }

  static async getVehicles() {
    const token = await AsyncStorage.getItem('tesla_token');
    try {
      const response = await axios.get(`${BASE_URL}/vehicles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.response;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  static async getVehicleData(vehicleId) {
    const token = await AsyncStorage.getItem('tesla_token');
    try {
      const response = await axios.get(`${BASE_URL}/vehicles/${vehicleId}/vehicle_data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.response;
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      throw error;
    }
  }

  static async setTemperature(vehicleId, temp) {
    const token = await AsyncStorage.getItem('tesla_token');
    try {
      const response = await axios.post(
        `${BASE_URL}/vehicles/${vehicleId}/command/set_temps`,
        { driver_temp: temp },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      return response.data.response;
    } catch (error) {
      console.error('Error setting temperature:', error);
      throw error;
    }
  }

  static async startHVAC(vehicleId) {
    const token = await AsyncStorage.getItem('tesla_token');
    try {
      const response = await axios.post(
        `${BASE_URL}/vehicles/${vehicleId}/command/auto_conditioning_start`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      return response.data.response;
    } catch (error) {
      console.error('Error starting HVAC:', error);
      throw error;
    }
  }
}
