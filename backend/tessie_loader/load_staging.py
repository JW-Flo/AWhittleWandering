import os
import json
import sqlite3
import glob
from datetime import datetime

def load_staging_data():
    """Load raw Tessie data from staging files into database."""
    staging_dir = os.path.join(os.path.dirname(__file__), 'staging')
    if not os.path.exists(staging_dir):
        print('Staging directory not found')
        return
    
    # Connect to SQLite database (in-memory for simplicity, change as needed)
    db_path = os.path.join(os.path.dirname(__file__), 'tessie_staging.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create staging table if not exists
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tessie_vehicle_state (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT NOT NULL,
            data_json TEXT NOT NULL,
            extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Process all JSON files in staging directory
    pattern = os.path.join(staging_dir, '*.json')
    files = glob.glob(pattern)
    
    if not files:
        print('No staging files found')
        return
    
    loaded_count = 0
    for filepath in files:
        try:
            # Extract vehicle ID from filename
            filename = os.path.basename(filepath)
            # Format: vehicle_id_timestamp.json
            vehicle_id = filename.split('_')[0]
            
            with open(filepath, 'r') as f:
                data_json = f.read()
                # Validate JSON
                json.loads(data_json)
            
            # Insert into database
            cursor.execute('''
                INSERT INTO tessie_vehicle_state (vehicle_id, data_json)
                VALUES (?, ?)
            ''', (vehicle_id, data_json))
            
            loaded_count += 1
            print(f'Loaded {filename}')
            
        except json.JSONDecodeError:
            print(f'Invalid JSON in file {filename}')
        except Exception as e:
            print(f'Error loading {filename}: {str(e)}')
    
    conn.commit()
    conn.close()
    
    print(f'Successfully loaded {loaded_count} records into {db_path}')

if __name__ == '__main__':
    load_staging_data()
