import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Card, Icon } from '@rneui/themed';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring
} from 'react-native-reanimated';
import { TeslaAPI } from '../utils/TeslaAPI';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [range, setRange] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [nextStop, setNextStop] = useState('Supercharger - Kettleman City');
  const [timeToNext, setTimeToNext] = useState('2h 30m');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const batteryScale = useSharedValue(1);

  const animatedBatteryStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: batteryScale.value }],
    };
  });

  useEffect(() => {
    let interval;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Get Tesla vehicles
        const vehicles = await TeslaAPI.getVehicles();
        if (!vehicles || vehicles.length === 0) {
          setError('No Tesla vehicles found for this account.');
          setLoading(false);
          return;
        }
        const vehicleId = vehicles[0].id_s;
        // Get vehicle data
        const data = await TeslaAPI.getVehicleData(vehicleId);
        setBatteryLevel(data.charge_state?.battery_level ?? null);
        setRange(data.charge_state?.battery_range ?? null);
        setTemperature(data.climate_state?.inside_temp ?? null);
        setLoading(false);

        // Set up periodic refresh
        interval = setInterval(async () => {
          try {
            const updatedData = await TeslaAPI.getVehicleData(vehicleId);
            setBatteryLevel(updatedData.charge_state?.battery_level ?? null);
            setRange(updatedData.charge_state?.battery_range ?? null);
            setTemperature(updatedData.climate_state?.inside_temp ?? null);
            // Animate battery icon
            batteryScale.value = withSpring(0.8);
            setTimeout(() => {
              batteryScale.value = withSpring(1);
            }, 500);
          } catch (err) {
            setError('Failed to refresh Tesla data.');
          }
        }, 30000); // 30s refresh
      } catch (err) {
        setError('Failed to fetch Tesla vehicle data. Please check your connection and Tesla login.');
        setLoading(false);
      }
    })();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.mainCard}>
        <View style={styles.batteryContainer}>
          <Animated.View style={[styles.batteryIcon, animatedBatteryStyle]}>
            <Icon
              name={batteryLevel > 20 ? 'battery-charging' : 'battery-alert'}
              type="material-community"
              color={batteryLevel > 20 ? '#4CAF50' : '#f44336'}
              size={40}
            />
          </Animated.View>
          <View style={styles.batteryInfo}>
            <Text style={styles.percentage}>
              {batteryLevel !== null ? `${Math.round(batteryLevel)}%` : '--'}
            </Text>
            <Text style={styles.range}>
              {range !== null ? `${Math.round(range)} mi` : '-- mi'}
            </Text>
          </View>
        </View>
        {loading && (
          <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 16 }} />
        )}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </Card>

      <Card containerStyle={styles.card}>
        <Card.Title style={styles.cardTitle}>Next Stop</Card.Title>
        <View style={styles.stopInfo}>
          <Icon name="map-marker-distance" type="material-community" color="#2196F3" size={24} />
          <View style={styles.stopTextContainer}>
            <Text style={styles.stopName}>{nextStop}</Text>
            <Text style={styles.stopTime}>Arriving in: {timeToNext}</Text>
          </View>
        </View>
      </Card>

      <Card containerStyle={styles.card}>
        <Card.Title style={styles.cardTitle}>Dog Mode</Card.Title>
        <View style={styles.dogModeContainer}>
          <Icon name="dog" type="material-community" color="#FF9800" size={24} />
          <View style={styles.temperatureContainer}>
            <Text style={styles.temperature}>
              {temperature !== null ? `${temperature}°F` : '--°F'}
            </Text>
            <Text style={styles.tempStatus}>Cabin temperature stable</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  mainCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    marginHorizontal: 0,
    marginTop: 0,
    width: width,
    borderWidth: 0,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    marginHorizontal: 10,
    borderWidth: 0,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'left',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  batteryIcon: {
    marginRight: 20,
  },
  batteryInfo: {
    flex: 1,
  },
  percentage: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  range: {
    color: '#BBBBBB',
    fontSize: 18,
  },
  stopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  stopTextContainer: {
    marginLeft: 15,
  },
  stopName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  stopTime: {
    color: '#BBBBBB',
    fontSize: 14,
    marginTop: 5,
  },
  dogModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  temperatureContainer: {
    marginLeft: 15,
  },
  temperature: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
  },
  tempStatus: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 5,
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
