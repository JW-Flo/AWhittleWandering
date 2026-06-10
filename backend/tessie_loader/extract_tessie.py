import os
import json
import time
import urllib.request
import urllib.error
from datetime import datetime

def extract_tessie_data():
    """Extract raw data from Tessie API and save to staging directory."""
    api_key = os.environ.get('TESSIE_API_KEY')
    if not api_key:
        raise ValueError('TESSIE_API_KEY environment variable not set')
    
    base_url = f'https://api.tessie.com/{api_key}'
    vehicles_url = f'{base_url}/vehicles'
    
    # Create staging directory
    staging_dir = os.path.join(os.path.dirname(__file__), 'staging')
    os.makedirs(staging_dir, exist_ok=True)
    
    try:
        # Get list of vehicles
        with urllib.request.urlopen(vehicles_url) as response:
            vehicles_data = json.load(response)
        
        timestamp = datetime.utcnow().isoformat()
        
        for vehicle in vehicles_data:
            vehicle_id = vehicle.get('id')
            if not vehicle_id:
                continue
                
            state_url = f'{base_url}/vehicles/{vehicle_id}/state'
            try:
                time.sleep(0.2)  # Rate limiting
                with urllib.request.urlopen(state_url) as response:
                    state_data = json.load(response)
                
                # Save raw data
                filename = f'{vehicle_id}_{timestamp.replace(":", "-")}.json'
                filepath = os.path.join(staging_dir, filename)
                with open(filepath, 'w') as f:
                    json.dump(state_data, f, indent=2)
                
                print(f'Saved state for vehicle {vehicle_id}')
                
            except urllib.error.HTTPError as e:
                print(f'HTTP error for vehicle {vehicle_id}: {e.code} {e.reason}')
            except Exception as e:
                print(f'Error processing vehicle {vehicle_id}: {str(e)}')
                
    except Exception as e:
        print(f'Failed to extract Tessie data: {str(e)}')
        raise

if __name__ == '__main__':
    extract_tessie_data()
