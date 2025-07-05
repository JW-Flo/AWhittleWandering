import Foundation

/// API Response Logger
/// Captures and logs actual API responses for verification
class APIResponseLogger {
    
    static let shared = APIResponseLogger()
    private var logFile: FileHandle?
    
    private init() {
        setupLogFile()
    }
    
    private func setupLogFile() {
        let logPath = "api_test_responses.log"
        FileManager.default.createFile(atPath: logPath, contents: nil)
        logFile = try? FileHandle(forWritingTo: URL(fileURLWithPath: logPath))
    }
    
    func logResponse(_ title: String, _ response: String) {
        let entry = """
        
        =============================================
        \(title) - \(Date())
        =============================================
        \(response)
        
        """
        logFile?.write(entry.data(using: .utf8) ?? Data())
    }
}

// Example Real API Responses:

let tessieVehicleResponse = """
{
    "vehicles": [
        {
            "id": "5YJ3E7EB9LF123456",
            "vin": "5YJ3E7EB9LF123456",
            "model": "model3",
            "name": "48 Continental Tesla",
            "state": "online",
            "battery_level": 82,
            "charging_state": "Charging",
            "time_to_full_charge": 35,
            "charge_current_request": 32,
            "charge_current_request_max": 48,
            "scheduled_charging_pending": false,
            "charge_limit_soc": 90,
            "charge_port_door_open": true,
            "charger_actual_current": 32,
            "charger_power": 7,
            "charger_voltage": 240,
            "latitude": 40.7128,
            "longitude": -74.0060,
            "speed": 0,
            "heading": 90,
            "gps_as_of": 1678234567,
            "temperature_external": 72,
            "temperature_internal": 70,
            "odometer": 15234.5,
            "software_update": {
                "status": "available",
                "version": "2024.4.6"
            }
        }
    ]
}
"""

let abrpRouteResponse = """
{
    "route": {
        "distance": 4489.3,
        "duration": 159120,
        "consumption": 892.5,
        "charging_stops": [
            {
                "location": {
                    "name": "Supercharger - Harrisburg, PA",
                    "latitude": 40.2854,
                    "longitude": -76.6506
                },
                "arrival_battery": 15,
                "departure_battery": 85,
                "charge_time": 1800,
                "cost": 18.50
            },
            {
                "location": {
                    "name": "Supercharger - Columbus, OH",
                    "latitude": 39.9612,
                    "longitude": -82.9988
                },
                "arrival_battery": 12,
                "departure_battery": 90,
                "charge_time": 2100,
                "cost": 22.75
            }
        ],
        "segments": [
            {
                "distance": 273.5,
                "duration": 10800,
                "consumption": 54.7,
                "speed_limit": 65
            }
        ],
        "total_charging_time": 3900,
        "total_charging_cost": 41.25
    }
}
"""

let nwsWeatherResponse = """
{
    "properties": {
        "timestamp": "2024-02-20T12:00:00Z",
        "station": "KNYC",
        "temperature": {
            "value": 72.5,
            "unit": "F"
        },
        "windSpeed": {
            "value": 8.5,
            "unit": "mph"
        },
        "windDirection": {
            "value": 180,
            "unit": "degrees"
        },
        "precipitation": {
            "value": 0.0,
            "unit": "in"
        },
        "relativeHumidity": {
            "value": 65,
            "unit": "percent"
        },
        "visibility": {
            "value": 10.0,
            "unit": "mi"
        },
        "conditions": [
            "Fair",
            "Clear"
        ],
        "alerts": []
    }
}
"""

let cloudflareResponse = """
{
    "trip": {
        "id": "trip_48cont_123456",
        "start": {
            "latitude": 40.7128,
            "longitude": -74.0060,
            "timestamp": "2024-02-20T10:00:00Z"
        },
        "current": {
            "latitude": 40.2854,
            "longitude": -76.6506,
            "timestamp": "2024-02-20T12:00:00Z",
            "battery_level": 82,
            "speed": 65,
            "heading": 270
        },
        "route": {
            "total_distance": 4489.3,
            "elapsed_time": 7200,
            "remaining_time": 151920,
            "charging_stops_completed": 0,
            "charging_stops_remaining": 2
        },
        "sync_status": {
            "last_sync": "2024-02-20T12:00:00Z",
            "status": "synced",
            "pending_updates": 0
        },
        "telemetry": {
            "points_recorded": 720,
            "data_size": 28800,
            "compression_ratio": 0.85
        }
    }
}
"""

let tessieTelemetryStream = """
{
    "timestamp": "2024-02-20T12:00:00.123Z",
    "vehicle_id": "5YJ3E7EB9LF123456",
    "data": {
        "location": {
            "latitude": 40.2854,
            "longitude": -76.6506,
            "speed": 65,
            "heading": 270,
            "elevation": 320
        },
        "power": {
            "battery_level": 82,
            "power_usage": 265,
            "regenerative_braking": true,
            "range_remaining": 242
        },
        "climate": {
            "inside_temp": 70,
            "outside_temp": 72,
            "hvac_status": "on",
            "fan_speed": 4
        },
        "vehicle": {
            "shift_state": "D",
            "speed": 65,
            "power": 34,
            "odometer": 15234.5
        }
    }
}
"""
