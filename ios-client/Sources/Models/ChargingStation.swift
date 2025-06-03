import Foundation

public struct ChargingStation: Codable, Identifiable {
    public let id: String
    public let location: LocationCoordinate
    public let name: String
    public let available: Bool
    public let chargerTypes: [ChargerType]
    public let powerKw: Double
    public let amenities: [Amenity]
    public let distanceFromRoute: Double
    
    public init(
        id: String,
        location: LocationCoordinate,
        name: String,
        available: Bool,
        chargerTypes: [ChargerType],
        powerKw: Double,
        amenities: [Amenity],
        distanceFromRoute: Double
    ) {
        self.id = id
        self.location = location
        self.name = name
        self.available = available
        self.chargerTypes = chargerTypes
        self.powerKw = powerKw
        self.amenities = amenities
        self.distanceFromRoute = distanceFromRoute
    }
    
    public enum ChargerType: String, Codable {
        case ccs = "CCS"
        case chademo = "CHAdeMO"
        case tesla = "Tesla"
        case j1772 = "J1772"
    }
    
    public enum Amenity: String, Codable {
        case restaurant = "Restaurant"
        case restroom = "Restroom"
        case shopping = "Shopping"
        case wifi = "WiFi"
        case parking = "Parking"
        case lodging = "Lodging"
    }
}
