import Foundation
import CoreLocation

public struct VehicleData: Codable, Identifiable {
    public let id: String
    public let vehicleId: String
    public let location: LocationCoordinate
    public let batteryLevel: Double
    public let range: Double
    public let speed: Double
    public let charging: Bool
    public let timestamp: Date
    
    public init(
        id: String = UUID().uuidString,
        vehicleId: String,
        location: LocationCoordinate,
        batteryLevel: Double,
        range: Double,
        speed: Double,
        charging: Bool,
        timestamp: Date = Date()
    ) {
        self.id = id
        self.vehicleId = vehicleId
        self.location = location
        self.batteryLevel = batteryLevel
        self.range = range
        self.speed = speed
        self.charging = charging
        self.timestamp = timestamp
    }
}

// Helper struct to make CLLocationCoordinate2D codable
public struct LocationCoordinate: Codable {
    public let latitude: Double
    public let longitude: Double
    
    public init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }
    
    public var clLocation: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}
