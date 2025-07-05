import Foundation
import CoreLocation

public struct WeatherModel: Codable, Equatable {
    public let temperature: Double
    public let condition: String
    public let alert: String?
    public let windSpeed: Double
    public let humidity: Double
    public let visibility: Double
    public let precipitation: Double
    public let timestamp: Date
    public let location: LocationCoordinate
    
    public init(
        temperature: Double,
        condition: String,
        alert: String? = nil,
        windSpeed: Double = 0,
        humidity: Double = 0,
        visibility: Double = 10,
        precipitation: Double = 0,
        timestamp: Date = Date(),
        location: LocationCoordinate
    ) {
        self.temperature = temperature
        self.condition = condition
        self.alert = alert
        self.windSpeed = windSpeed
        self.humidity = humidity
        self.visibility = visibility
        self.precipitation = precipitation
        self.timestamp = timestamp
        self.location = location
    }
    
    enum CodingKeys: String, CodingKey {
        case temperature = "temp"
        case condition = "weather"
        case alert
        case windSpeed = "wind_speed"
        case humidity
        case visibility
        case precipitation = "precip"
        case timestamp
        case location
    }
}

public struct WeatherAlert: Codable, Identifiable, Equatable {
    public let id: String
    public let severity: Severity
    public let title: String
    public let description: String
    public let area: [LocationCoordinate]
    public let startTime: Date
    public let endTime: Date
    
    public enum Severity: String, Codable {
        case minor
        case moderate
        case severe
        case extreme
        
        public var color: String {
            switch self {
            case .minor: return "#FFD700"     // Gold
            case .moderate: return "#FFA500"   // Orange
            case .severe: return "#FF4500"     // Red-Orange
            case .extreme: return "#FF0000"    // Red
            }
        }
    }
    
    public init(
        id: String,
        severity: Severity,
        title: String,
        description: String,
        area: [LocationCoordinate],
        startTime: Date,
        endTime: Date
    ) {
        self.id = id
        self.severity = severity
        self.title = title
        self.description = description
        self.area = area
        self.startTime = startTime
        self.endTime = endTime
    }
}

// MARK: - Helper Extensions

extension WeatherModel {
    public var isHazardous: Bool {
        return alert != nil || 
               windSpeed > 30 || 
               visibility < 2 || 
               precipitation > 0.5
    }
    
    public var temperatureString: String {
        return String(format: "%.1f°F", temperature)
    }
    
    public var windSpeedString: String {
        return String(format: "%.1f mph", windSpeed)
    }
    
    public var humidityString: String {
        return String(format: "%.0f%%", humidity * 100)
    }
    
    public var visibilityString: String {
        return String(format: "%.1f mi", visibility)
    }
    
    public var precipitationString: String {
        return String(format: "%.2f in", precipitation)
    }
    
    public var isOutdated: Bool {
        return Date().timeIntervalSince(timestamp) > 1800 // 30 minutes
    }
    
    public var weatherIcon: String {
        let condition = self.condition.lowercased()
        switch true {
        case condition.contains("rain"):
            return "cloud.rain"
        case condition.contains("snow"):
            return "cloud.snow"
        case condition.contains("cloud"):
            return "cloud"
        case condition.contains("sun"):
            return "sun.max"
        case condition.contains("thunder"):
            return "cloud.bolt"
        case condition.contains("fog"):
            return "cloud.fog"
        default:
            return "cloud"
        }
    }
}

extension WeatherAlert {
    public var isActive: Bool {
        let now = Date()
        return now >= startTime && now <= endTime
    }
    
    public var timeRemainingString: String {
        let remaining = endTime.timeIntervalSince(Date())
        let hours = Int(remaining) / 3600
        let minutes = Int(remaining) / 60 % 60
        return "\(hours)h \(minutes)m"
    }
    
    public var severityIcon: String {
        switch severity {
        case .minor: return "exclamationmark.triangle"
        case .moderate: return "exclamationmark.triangle.fill"
        case .severe: return "exclamationmark.octagon"
        case .extreme: return "exclamationmark.octagon.fill"
        }
    }
}

// MARK: - Preview Data

extension WeatherModel {
    public static var preview: WeatherModel {
        WeatherModel(
            temperature: 72.5,
            condition: "Partly Cloudy",
            alert: nil,
            windSpeed: 8.5,
            humidity: 0.65,
            visibility: 10.0,
            precipitation: 0.0,
            timestamp: Date(),
            location: LocationCoordinate(latitude: 37.7749, longitude: -122.4194)
        )
    }
}

extension WeatherAlert {
    public static var preview: WeatherAlert {
        WeatherAlert(
            id: "TEST_ALERT",
            severity: .moderate,
            title: "Flash Flood Warning",
            description: "Heavy rainfall may cause flash flooding in low-lying areas",
            area: [
                LocationCoordinate(latitude: 37.7749, longitude: -122.4194),
                LocationCoordinate(latitude: 37.8049, longitude: -122.4194)
            ],
            startTime: Date(),
            endTime: Date().addingTimeInterval(3600 * 3) // 3 hours
        )
    }
}
