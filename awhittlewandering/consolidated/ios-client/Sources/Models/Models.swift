import CoreLocation
import Foundation

enum NetworkState {
    case online
    case offline
}

struct Location: Codable, Equatable {
    let latitude: Double
    let longitude: Double

    func toCLLocation() -> CLLocation {
        return CLLocation(latitude: latitude, longitude: longitude)
    }
}

struct Route: Codable, Identifiable {
    let id: String
    let origin: Location
    let destination: Location
    let segments: [RouteSegment]
    let totalDistance: Double
    let totalDuration: TimeInterval
    let weatherRisk: Double
}

struct RouteSegment: Codable {
    let startPoint: Location
    let endPoint: Location
    let distance: Double
    let duration: TimeInterval
    let weatherRisk: Double
    let chargingStops: [ChargingStop]
}

struct ChargingStop: Codable {
    let location: Location
    let durationMinutes: Int
    let targetSoC: Double
}

struct Visit: Codable {
    let latitude: Double
    let longitude: Double
    let timestamp: Date
}

struct WeatherData: Codable {
    let forecast: WeatherForecast
    let alerts: [WeatherAlert]
    let timestamp: Date
    var isFromCache: Bool
}

struct WeatherForecast: Codable {
    let temperature: Double
    let windSpeed: Double
    let precipitation: Double
    let conditions: [String]
}

struct WeatherAlert: Codable {
    let severity: Int
    let description: String
    let validUntil: Date
}

struct WeatherRisk: Codable {
    let severity: Double
    let conditions: [String]
    var isFromCache: Bool
}

enum OfflineError: Error {
    case cacheMiss
    case storageError
    case networkError
    case invalidData
}
