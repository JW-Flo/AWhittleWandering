import CoreLocation
import Foundation

public struct Coordinate: Codable, Hashable, Identifiable {
    public var id: String { "\(latitude),\(longitude)" }
    public let latitude: Double
    public let longitude: Double

    public init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }

    public init(from coordinate: CLLocationCoordinate2D) {
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
    }

    public var toCLCoordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

public struct DisplayRoute: Identifiable, Codable, Hashable {
    public let id: UUID
    public let coordinates: [Coordinate]
    public let weatherRisk: Double
    public let requiredStops: Int
    public let totalDuration: TimeInterval
    public let totalDistance: Double
    public let chargingStops: [ChargingStation]
    public let statesCrossed: [String]
    public let elevationChanges: [Double]

    public init(
        id: UUID = UUID(),
        coordinates: [Coordinate],
        weatherRisk: Double,
        requiredStops: Int,
        totalDuration: TimeInterval,
        totalDistance: Double,
        chargingStops: [ChargingStation] = [],
        statesCrossed: [String] = [],
        elevationChanges: [Double] = []
    ) {
        self.id = id
        self.coordinates = coordinates
        self.weatherRisk = weatherRisk
        self.requiredStops = requiredStops
        self.totalDuration = totalDuration
        self.totalDistance = totalDistance
        self.chargingStops = chargingStops
        self.statesCrossed = statesCrossed
        self.elevationChanges = elevationChanges
    }

    public var clCoordinates: [CLLocationCoordinate2D] {
        coordinates.map { $0.toCLCoordinate }
    }

    public static var preview: DisplayRoute {
        DisplayRoute(
            coordinates: [
                Coordinate(latitude: 37.7749, longitude: -122.4194),  // San Francisco
                Coordinate(latitude: 36.7783, longitude: -119.4179),  // Fresno
                Coordinate(latitude: 34.0522, longitude: -118.2437),  // Los Angeles
            ],
            weatherRisk: 0.2,
            requiredStops: 1,
            totalDuration: 21600,  // 6 hours
            totalDistance: 687.0,  // km
            chargingStops: [
                ChargingStation(
                    id: "preview1",
                    location: LocationCoordinate(latitude: 36.7783, longitude: -119.4179),
                    name: "Fresno Supercharger",
                    available: true,
                    chargerTypes: [.tesla],
                    powerKw: 250,
                    amenities: [.restaurant, .restroom],
                    distanceFromRoute: 0.1
                )
            ],
            statesCrossed: ["CA"],
            elevationChanges: [0, 100, 200, 150]
        )
    }
    
    // Computed properties for route analysis
    public var averageElevation: Double {
        elevationChanges.reduce(0, +) / Double(max(elevationChanges.count, 1))
    }
    
    public var totalElevationGain: Double {
        zip(elevationChanges, elevationChanges.dropFirst())
            .map { $0.1 - $0.0 }
            .filter { $0 > 0 }
            .reduce(0, +)
    }
    
    public var estimatedChargingTime: TimeInterval {
        Double(requiredStops) * 20 * 60 // 20 minutes per stop
    }
    
    public var totalEstimatedTime: TimeInterval {
        totalDuration + estimatedChargingTime
    }
}
