import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Dimensions } from 'react-native';
import { ListItem, Text, Slider, Icon } from '@rneui/themed';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const [lowSoCThreshold, setLowSoCThreshold] = useState(15);
  const [highTempThreshold, setHighTempThreshold] = useState(90);
  const [dogModeEnabled, setDogModeEnabled] = useState(true);
  const [autoNavigationEnabled, setAutoNavigationEnabled] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);
  const [nightMode, setNightMode] = useState(false);

  const renderSection = (title) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {renderSection('Vehicle Settings')}
      
      <ListItem containerStyle={styles.listItem}>
        <Icon name="battery-low" type="material-community" color="#4CAF50" />
        <ListItem.Content>
          <ListItem.Title style={styles.title}>Low Battery Alert</ListItem.Title>
          <Slider
            value={lowSoCThreshold}
            onValueChange={setLowSoCThreshold}
            minimumValue={5}
            maximumValue={30}
            step={1}
            thumbTintColor="#2196F3"
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#666666"
            thumbStyle={styles.thumbStyle}
          />
          <ListItem.Subtitle style={styles.subtitle}>{lowSoCThreshold}%</ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>

      <ListItem containerStyle={styles.listItem}>
        <Icon name="thermometer" type="material-community" color="#FF9800" />
        <ListItem.Content>
          <ListItem.Title style={styles.title}>Temperature Alert</ListItem.Title>
          <Slider
            value={highTempThreshold}
            onValueChange={setHighTempThreshold}
            minimumValue={70}
            maximumValue={100}
            step={1}
            thumbTintColor="#2196F3"
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#666666"
            thumbStyle={styles.thumbStyle}
          />
          <ListItem.Subtitle style={styles.subtitle}>{highTempThreshold}°F</ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>

      {renderSection('Features')}

      <ListItem containerStyle={styles.listItem}>
        <Icon name="dog" type="material-community" color="#FF9800" />
        <ListItem.Content>
          <ListItem.Title style={styles.title}>Dog Mode</ListItem.Title>
          <ListItem.Subtitle style={styles.subtitle}>Keep your pet comfortable</ListItem.Subtitle>
        </ListItem.Content>
        <Switch
          value={dogModeEnabled}
          onValueChange={setDogModeEnabled}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={dogModeEnabled ? '#2196F3' : '#f4f3f4'}
        />
      </ListItem>

      <ListItem containerStyle={styles.listItem}>
        <Icon name="navigation" type="material-community" color="#4CAF50" />
        <ListItem.Content>
          <ListItem.Title style={styles.title}>Auto Navigation</ListItem.Title>
          <ListItem.Subtitle style={styles.subtitle}>Route to next supercharger</ListItem.Subtitle>
        </ListItem.Content>
        <Switch
          value={autoNavigationEnabled}
          onValueChange={setAutoNavigationEnabled}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={autoNavigationEnabled ? '#2196F3' : '#f4f3f4'}
        />
      </ListItem>

      {renderSection('App Settings')}

      <ListItem containerStyle={styles.listItem}>
        <Icon name="database" type="material-community" color="#2196F3" />
        <ListItem.Content>
          <ListItem.Title style={styles.title}>Data Collection</ListItem.Title>
          <ListItem.Subtitle style={styles.subtitle}>Improve trip planning</ListItem.Subtitle>
        </ListItem.Content>
        <Switch
          value={dataCollection}
          onValueChange={setDataCollection}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={dataCollection ? '#2196F3' : '#f4f3f4'}
        />
      </ListItem>

      <ListItem containerStyle={styles.listItem}>
        <Icon name="theme-light-dark" type="material-community" color="#9C27B0" />
        <ListItem.Content>
          <ListItem.Title style={styles.title}>Night Mode</ListItem.Title>
          <ListItem.Subtitle style={styles.subtitle}>Darker theme at night</ListItem.Subtitle>
        </ListItem.Content>
        <Switch
          value={nightMode}
          onValueChange={setNightMode}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={nightMode ? '#2196F3' : '#f4f3f4'}
        />
      </ListItem>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  section: {
    padding: 16,
    backgroundColor: '#121212',
  },
  sectionTitle: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  listItem: {
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  subtitle: {
    color: '#BBBBBB',
    fontSize: 14,
  },
  thumbStyle: {
    width: 20,
    height: 20,
  },
});
