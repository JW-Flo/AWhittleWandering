/**
 * Script to convert the 48 Continental USA itinerary from CSV to JSON format
 * This creates a properly formatted itinerary file that conforms to our shared data model
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Paths
const CSV_PATH = path.join(__dirname, '../docs/48Continental_Final_Itinerary.csv');
const JSON_OUTPUT_PATH = path.join(__dirname, '../shared/data/itinerary.json');

// Ensure the output directory exists
const outputDir = path.dirname(JSON_OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Initialize the itinerary object
const itinerary = {
  version: "1.0.0",
  lastUpdated: new Date().toISOString(),
  stops: []
};

// Helper function to process date ranges
function processDateRange(dateStr) {
  const currentYear = new Date().getFullYear();
  
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

// Process the CSV file
fs.createReadStream(CSV_PATH)
  .pipe(csv())
  .on('data', (row) => {
    // Extract date information
    const dateInfo = processDateRange(row['Date(s)']);
    
    // Create the stop object
    const stop = {
      startDate: dateInfo.startDate,
      location: row.Location,
      state: row.State,
      duration: row.Duration,
      notes: row.Notes || undefined
    };
    
    // Add optional fields if they exist
    if (dateInfo.endDate) stop.endDate = dateInfo.endDate;
    if (row['Person Seen'] && row['Person Seen'].trim() !== '') {
      stop.personSeen = row['Person Seen'];
    }
    
    // Add to itinerary stops
    itinerary.stops.push(stop);
  })
  .on('end', () => {
    // Save as JSON
    fs.writeFileSync(
      JSON_OUTPUT_PATH, 
      JSON.stringify(itinerary, null, 2),
      'utf8'
    );
    
    console.log(`✓ Itinerary converted and saved to ${JSON_OUTPUT_PATH}`);
    console.log(`  Total stops: ${itinerary.stops.length}`);
  })
  .on('error', (error) => {
    console.error('Error processing CSV:', error);
    process.exit(1);
  });
