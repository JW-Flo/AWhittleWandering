#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface CSVRow {
  [key: string]: string;
}

interface TimelineEntry {
  date: string;
  state: string;
  keyStops: string;
  latitude?: number;
  longitude?: number;
  odometer?: number;
  battery_level?: number;
}

interface TeslaTelemtryEntry {
  timestamp: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  battery_level: number;
  battery_range: number;
  odometer: number;
  outside_temp: number;
  charging_state: string;
  state?: string;
}

// Enhanced CSV parser that auto-detects column formats
function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }
  }
  
  return rows;
}

// Detect CSV format based on headers
function detectCSVFormat(headers: string[]): 'timeline' | 'telemetry' | 'unknown' {
  const headerStr = headers.join('|').toLowerCase();
  
  if (headerStr.includes('date') && headerStr.includes('state') && headerStr.includes('key')) {
    return 'timeline';
  } else if (headerStr.includes('latitude') && headerStr.includes('longitude') && headerStr.includes('battery')) {
    return 'telemetry';
  }
  
  return 'unknown';
}

// Parse timeline CSV (Date | State | Key Stops format)
function parseTimelineCSV(rows: CSVRow[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  
  for (const row of rows) {
    // Try different header variations
    const dateField = row['Date(s)'] || row['Date'] || row['date'] || '';
    const stateField = row['State(s)'] || row['State'] || row['state'] || '';
    const keyStopsField = row['Key Stop(s) / Activities'] || row['Key Stops'] || row['Activities'] || row['key_stops'] || '';
    
    if (dateField && stateField) {
      // Parse multiple states if separated by →
      const states = stateField.split('→').map(s => s.trim());
      const primaryState = states[states.length - 1]; // Use final destination state
      
      entries.push({
        date: dateField,
        state: primaryState,
        keyStops: keyStopsField
      });
    }
  }
  
  return entries;
}

// Parse telemetry CSV (Tesla driving data format)  
function parseTelemetryCSV(rows: CSVRow[]): TeslaTelemtryEntry[] {
  const entries: TeslaTelemtryEntry[] = [];
  
  for (const row of rows) {
    try {
      const timestamp = new Date(row.Date || row.timestamp || '').getTime();
      const latitude = parseFloat(row.Latitude || row.latitude || '0');
      const longitude = parseFloat(row.Longitude || row.longitude || '0');
      const speed = parseFloat(row.Speed || row.speed || '0');
      const heading = parseFloat(row.Heading || row.heading || '0');
      const battery_level = parseFloat(row['Battery Level'] || row.battery_level || '0');
      const battery_range = parseFloat(row['Battery Range'] || row.battery_range || '0');
      const odometer = parseFloat(row.Odometer || row.odometer || '0');
      const outside_temp = parseFloat(row['Outside Temp'] || row.outside_temp || '0');
      const charging_state = row['Charging State'] || row.charging_state || 'Disconnected';
      
      if (timestamp && latitude && longitude) {
        entries.push({
          timestamp,
          latitude,
          longitude,
          speed,
          heading,
          battery_level,
          battery_range,
          odometer,
          outside_temp,
          charging_state,
          state: row.State || row.state
        });
      }
    } catch (error) {
      console.warn(`Skipping invalid telemetry row:`, row);
    }
  }
  
  return entries;
}

// State detection from coordinates (simplified)
function getStateFromCoordinates(lat: number, lng: number): string {
  // This is a simplified version - you could integrate with a proper geocoding service
  const stateRegions = {
    'Texas': { latMin: 25.8, latMax: 36.5, lngMin: -106.6, lngMax: -93.5 },
    'California': { latMin: 32.5, latMax: 42.0, lngMin: -124.4, lngMax: -114.1 },
    'Florida': { latMin: 24.4, latMax: 31.0, lngMin: -87.6, lngMax: -80.0 },
    'New York': { latMin: 40.5, latMax: 45.0, lngMin: -79.8, lngMax: -71.9 },
    // Add more states as needed
  };
  
  for (const [state, bounds] of Object.entries(stateRegions)) {
    if (lat >= bounds.latMin && lat <= bounds.latMax && 
        lng >= bounds.lngMin && lng <= bounds.lngMax) {
      return state;
    }
  }
  
  return 'Unknown';
}

async function importCSVData(csvPath?: string) {
  const inputPath = csvPath || process.argv[2];
  
  if (!inputPath) {
    console.error('❌ Please provide a CSV file path');
    console.log('Usage: bun run scripts/import-tesla-data.ts <csv-file-path>');
    console.log('');
    console.log('Supported formats:');
    console.log('1. Timeline: Date(s) | State(s) | Key Stop(s) / Activities');
    console.log('2. Telemetry: Date, Latitude, Longitude, Battery Level, etc.');
    process.exit(1);
  }
  
  try {
    console.log(`📊 Importing CSV data from: ${inputPath}`);
    
    const content = readFileSync(inputPath, 'utf-8');
    const rows = parseCSV(content);
    
    if (rows.length === 0) {
      console.error('❌ No valid data found in CSV');
      return;
    }
    
    const headers = Object.keys(rows[0]);
    const format = detectCSVFormat(headers);
    
    console.log(`📋 Detected format: ${format}`);
    console.log(`📈 Found ${rows.length} records`);
    console.log(`📝 Headers: ${headers.join(', ')}`);
    
    let outputData: any = {};
    
    if (format === 'timeline') {
      const timelineEntries = parseTimelineCSV(rows);
      console.log(`🗓️  Processed ${timelineEntries.length} timeline entries`);
      
      // Extract unique states
      const states = [...new Set(timelineEntries.map(entry => entry.state).filter(Boolean))];
      console.log(`🗺️  States visited: ${states.join(', ')}`);
      
      outputData = {
        type: 'timeline',
        totalEntries: timelineEntries.length,
        statesVisited: states.length,
        states: states,
        entries: timelineEntries,
        summary: {
          startDate: timelineEntries[0]?.date,
          endDate: timelineEntries[timelineEntries.length - 1]?.date,
          totalStates: states.length
        }
      };
      
      // Save timeline data
      const timelineOutput = join(process.cwd(), 'data', 'processed_timeline.json');
      writeFileSync(timelineOutput, JSON.stringify(outputData, null, 2));
      console.log(`💾 Timeline data saved to: ${timelineOutput}`);
      
    } else if (format === 'telemetry') {
      const telemetryEntries = parseTelemetryCSV(rows);
      console.log(`🚗 Processed ${telemetryEntries.length} telemetry entries`);
      
      // Add state detection for entries missing state info
      for (const entry of telemetryEntries) {
        if (!entry.state && entry.latitude && entry.longitude) {
          entry.state = getStateFromCoordinates(entry.latitude, entry.longitude);
        }
      }
      
      // Calculate statistics
      const states = [...new Set(telemetryEntries.map(entry => entry.state).filter(Boolean))];
      const totalMiles = telemetryEntries.length > 0 ? 
        telemetryEntries[telemetryEntries.length - 1].odometer - telemetryEntries[0].odometer : 0;
      
      console.log(`🗺️  States detected: ${states.join(', ')}`);
      console.log(`📏 Total miles: ${totalMiles.toFixed(1)}`);
      
      outputData = {
        type: 'telemetry',
        totalEntries: telemetryEntries.length,
        statesVisited: states.length,
        states: states,
        totalMiles: totalMiles,
        entries: telemetryEntries.slice(0, 1000), // Limit for performance
        summary: {
          startTime: telemetryEntries[0]?.timestamp,
          endTime: telemetryEntries[telemetryEntries.length - 1]?.timestamp,
          totalStates: states.length,
          totalMiles: totalMiles
        }
      };
      
      // Save telemetry data
      const telemetryOutput = join(process.cwd(), 'data', 'processed_telemetry.json');
      writeFileSync(telemetryOutput, JSON.stringify(outputData, null, 2));
      console.log(`💾 Telemetry data saved to: ${telemetryOutput}`);
      
    } else {
      console.warn('⚠️  Unknown CSV format detected');
      console.log('Expected headers for timeline format: Date(s), State(s), Key Stop(s) / Activities');
      console.log('Expected headers for telemetry format: Date, Latitude, Longitude, Battery Level, etc.');
      
      // Save raw data for manual inspection
      const rawOutput = join(process.cwd(), 'data', 'raw_csv_data.json');
      writeFileSync(rawOutput, JSON.stringify({ headers, rows: rows.slice(0, 10) }, null, 2));
      console.log(`💾 Raw sample data saved to: ${rawOutput}`);
    }
    
    console.log('✅ CSV import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error importing CSV data:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module || process.argv[1]?.endsWith('import-tesla-data.ts')) {
  importCSVData();
}
