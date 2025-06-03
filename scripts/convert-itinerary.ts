/**
 * Script to convert the 48 Continental USA itinerary from CSV to JSON format
 * This creates a properly formatted itinerary file that conforms to our shared data model
 */

import fs from 'fs';
import path from 'path';
import { Itinerary, ItineraryStop } from '../shared/models/itinerary';

// Paths
const CSV_PATH = path.resolve(__dirname, '../docs/48Continental_Final_Itinerary.csv');
const JSON_OUTPUT_PATH = path.resolve(__dirname, '../shared/data/itinerary.json');

// Ensure the output directory exists
const outputDir = path.dirname(JSON_OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Initialize the itinerary object
const itinerary: Itinerary = {
  version: "1.0.0",
  lastUpdated: new Date().toISOString(),
  stops: []
};

// Helper function to process date ranges
function processDateRange(dateStr: string): { startDate: string; endDate?: string } {
  if (dateStr.includes('–')) {
    const [start, end] = dateStr.split('–');
    return {
      startDate: start,
      endDate: end
    };
  }
  
  return {
    startDate: dateStr
  };
}

// Read and parse CSV file
function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(line => line.trim() !== '').map(line => {
    // Handle potential commas inside quoted fields
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Push the last value
    values.push(currentValue);
    
    // Create an object with headers as keys
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    return record;
  });
}

// Convert CSV to Itinerary
function convertCsvToItinerary(): void {
  try {
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parseCSV(csvContent);
    
    records.forEach(row => {
      // Extract date information
      const dateInfo = processDateRange(row['Date(s)']);
      
      // Create the stop object
      const stop: ItineraryStop = {
        startDate: dateInfo.startDate,
        location: row['Location'],
        state: row['State'],
        duration: row['Duration'],
        notes: row['Notes'] && row['Notes'].trim() !== '' ? row['Notes'] : undefined
      };
      
      // Add optional fields if they exist
      if (dateInfo.endDate) stop.endDate = dateInfo.endDate;
      if (row['Person Seen'] && row['Person Seen'].trim() !== '') {
        stop.personSeen = row['Person Seen'];
      }
      
      // Add to itinerary stops
      itinerary.stops.push(stop);
    });
    
    // Save as JSON
    fs.writeFileSync(
      JSON_OUTPUT_PATH, 
      JSON.stringify(itinerary, null, 2),
      'utf8'
    );
    
    console.log(`✓ Itinerary converted and saved to ${JSON_OUTPUT_PATH}`);
    console.log(`  Total stops: ${itinerary.stops.length}`);
    
  } catch (error) {
    console.error('Error processing CSV:', error);
    process.exit(1);
  }
}

// Run the conversion
convertCsvToItinerary();
