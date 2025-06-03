import Foundation
import RealmSwift
import MapboxMaps

public class OfflineManager {
    public static let shared = OfflineManager()
    
    private let realm: Realm
    private let tileStore: TileStore
    private let cacheDirectory: URL
    
    // MARK: - Initialization
    
    private init() {
        // Setup Realm configuration
        let config = Realm.Configuration(
            schemaVersion: 1,
            migrationBlock: { migration, oldSchemaVersion in
                // Handle future schema migrations
            }
        )
        
        realm = try! Realm(configuration: config)
        
        // Setup tile store for offline maps
        tileStore = TileStore.default
        
        // Setup cache directory
        cacheDirectory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("OfflineData")
        try? FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
    
    // MARK: - Cache Management
    
    public func cacheRoute(_ route: DisplayRoute) {
        // Cache route data in Realm
        try? realm.write {
            realm.add(RouteCache(route: route), update: .modified)
        }
        
        // Download map tiles for offline use
        downloadMapTiles(for: route)
    }
    
    public func cacheChargingStations(_ stations: [ChargingStation]) {
        try? realm.write {
            stations.forEach { station in
                realm.add(ChargingStationCache(station: station), update: .modified)
            }
        }
    }
    
    public func cacheVehicleData(_ vehicle: VehicleData) {
        try? realm.write {
            realm.add(VehicleDataCache(vehicle: vehicle), update: .modified)
        }
    }
    
    public func cacheTripData(_ trip: TripData) {
        try? realm.write {
            realm.add(TripDataCache(trip: trip), update: .modified)
        }
    }
    
    // MARK: - Data Retrieval
    
    public func getCachedRoute() -> DisplayRoute? {
        guard let routeCache = realm.objects(RouteCache.self).first else { return nil }
        return routeCache.toDisplayRoute()
    }
    
    public func getCachedChargingStations() -> [ChargingStation] {
        return realm.objects(ChargingStationCache.self).map { $0.toChargingStation() }
    }
    
    public func getCachedVehicleData() -> VehicleData? {
        guard let vehicleCache = realm.objects(VehicleDataCache.self).first else { return nil }
        return vehicleCache.toVehicleData()
    }
    
    public func getCachedTripData() -> TripData? {
        guard let tripCache = realm.objects(TripDataCache.self).first else { return nil }
        return tripCache.toTripData()
    }
    
    // MARK: - Map Tile Management
    
    private func downloadMapTiles(for route: DisplayRoute) {
        let options = TilesetDescriptorOptions(
            styleURI: .streets,
            zoomRange: 0...15,
            bounds: getBoundingBox(for: route)
        )
        
        tileStore.loadTileRegion(
            for: options,
            progress: { progress in
                // Update download progress
                print("Downloaded \(progress.completedResourceCount)/\(progress.totalResourceCount) tiles")
            },
            completion: { result in
                switch result {
                case .success:
                    print("Successfully downloaded offline map tiles")
                case .failure(let error):
                    print("Failed to download map tiles: \(error)")
                }
            }
        )
    }
    
    private func getBoundingBox(for route: DisplayRoute) -> CoordinateBounds {
        let coordinates = route.coordinates.map { $0.toCLCoordinate }
        
        let minLat = coordinates.map { $0.latitude }.min() ?? 0
        let maxLat = coordinates.map { $0.latitude }.max() ?? 0
        let minLon = coordinates.map { $0.longitude }.min() ?? 0
        let maxLon = coordinates.map { $0.longitude }.max() ?? 0
        
        // Add padding to bounding box
        let padding = 0.1 // degrees
        
        return CoordinateBounds(
            southwest: CLLocationCoordinate2D(latitude: minLat - padding, longitude: minLon - padding),
            northeast: CLLocationCoordinate2D(latitude: maxLat + padding, longitude: maxLon + padding)
        )
    }
    
    // MARK: - Cache Cleanup
    
    public func clearOutdatedCache() {
        // Remove cached data older than 7 days
        let oldDate = Date().addingTimeInterval(-7 * 24 * 60 * 60)
        
        try? realm.write {
            let oldRoutes = realm.objects(RouteCache.self).filter("timestamp < %@", oldDate)
            realm.delete(oldRoutes)
            
            let oldStations = realm.objects(ChargingStationCache.self).filter("timestamp < %@", oldDate)
            realm.delete(oldStations)
        }
        
        // Clear old map tiles
        tileStore.clearAll { result in
            switch result {
            case .success:
                print("Successfully cleared old map tiles")
            case .failure(let error):
                print("Failed to clear map tiles: \(error)")
            }
        }
    }
}

// MARK: - Realm Cache Objects

class RouteCache: Object {
    @Persisted(primaryKey: true) var id: String
    @Persisted var routeData: Data
    @Persisted var timestamp: Date
    
    convenience init(route: DisplayRoute) {
        self.init()
        self.id = route.id.uuidString
        self.routeData = try! JSONEncoder().encode(route)
        self.timestamp = Date()
    }
    
    func toDisplayRoute() -> DisplayRoute? {
        try? JSONDecoder().decode(DisplayRoute.self, from: routeData)
    }
}

class ChargingStationCache: Object {
    @Persisted(primaryKey: true) var id: String
    @Persisted var stationData: Data
    @Persisted var timestamp: Date
    
    convenience init(station: ChargingStation) {
        self.init()
        self.id = station.id
        self.stationData = try! JSONEncoder().encode(station)
        self.timestamp = Date()
    }
    
    func toChargingStation() -> ChargingStation {
        try! JSONDecoder().decode(ChargingStation.self, from: stationData)
    }
}

class VehicleDataCache: Object {
    @Persisted(primaryKey: true) var id: String
    @Persisted var vehicleData: Data
    @Persisted var timestamp: Date
    
    convenience init(vehicle: VehicleData) {
        self.init()
        self.id = vehicle.id
        self.vehicleData = try! JSONEncoder().encode(vehicle)
        self.timestamp = Date()
    }
    
    func toVehicleData() -> VehicleData {
        try! JSONDecoder().decode(VehicleData.self, from: vehicleData)
    }
}

class TripDataCache: Object {
    @Persisted(primaryKey: true) var id: String
    @Persisted var tripData: Data
    @Persisted var timestamp: Date
    
    convenience init(trip: TripData) {
        self.init()
        self.id = trip.id
        self.tripData = try! JSONEncoder().encode(trip)
        self.timestamp = Date()
    }
    
    func toTripData() -> TripData {
        try! JSONDecoder().decode(TripData.self, from: tripData)
    }
}
