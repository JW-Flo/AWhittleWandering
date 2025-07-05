import CoreData
import CoreLocation
import Foundation

class CacheManager {
    static let shared = CacheManager()

    private let cache = NSCache<NSString, NSData>()
    private let fileManager = FileManager.default
    private let queue = DispatchQueue(label: "com.continentalusa.cache")

    private init() {
        cache.totalCostLimit = 100 * 1024 * 1024  // 100MB
        setupDirectory()
    }

    private var cacheDirectory: URL {
        fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("MapCache")
    }

    private func setupDirectory() {
        try? fileManager.createDirectory(
            at: cacheDirectory,
            withIntermediateDirectories: true
        )
    }

    func cacheMapTile(_ data: Data, z: Int, x: Int, y: Int) {
        let key = "tile:\(z):\(x):\(y)" as NSString
        cache.setObject(data as NSData, forKey: key, cost: data.count)

        queue.async {
            let fileURL = self.cacheDirectory.appendingPathComponent(key as String)
            try? data.write(to: fileURL)
        }
    }

    func getCachedMapTile(z: Int, x: Int, y: Int) -> Data? {
        let key = "tile:\(z):\(x):\(y)" as NSString

        // Check memory cache first
        if let data = cache.object(forKey: key) {
            return data as Data
        }

        // Check disk cache
        let fileURL = cacheDirectory.appendingPathComponent(key as String)
        if let data = try? Data(contentsOf: fileURL) {
            cache.setObject(data as NSData, forKey: key, cost: data.count)
            return data
        }

        return nil
    }

    func cacheWeatherData(_ data: Data, forLocation location: CLLocationCoordinate2D) {
        let key = "weather:\(location.latitude),\(location.longitude)" as NSString
        cache.setObject(data as NSData, forKey: key, cost: data.count)

        queue.async {
            let fileURL = self.cacheDirectory.appendingPathComponent(key as String)
            try? data.write(to: fileURL)
        }
    }

    func getCachedWeatherData(forLocation location: CLLocationCoordinate2D) -> Data? {
        let key = "weather:\(location.latitude),\(location.longitude)" as NSString

        if let data = cache.object(forKey: key) {
            return data as Data
        }

        let fileURL = cacheDirectory.appendingPathComponent(key as String)
        if let data = try? Data(contentsOf: fileURL) {
            cache.setObject(data as NSData, forKey: key, cost: data.count)
            return data
        }

        return nil
    }

    func cacheRoute(_ route: DisplayRoute) {
        let encoder = JSONEncoder()
        guard let data = try? encoder.encode(route) else { return }

        let key = "route:\(route.id)" as NSString
        cache.setObject(data as NSData, forKey: key, cost: data.count)

        queue.async {
            let fileURL = self.cacheDirectory.appendingPathComponent(key as String)
            try? data.write(to: fileURL)
        }
    }

    func getCachedRoute(id: UUID) -> DisplayRoute? {
        let key = "route:\(id)" as NSString
        let decoder = JSONDecoder()

        if let data = cache.object(forKey: key) as Data? {
            return try? decoder.decode(DisplayRoute.self, from: data)
        }

        let fileURL = cacheDirectory.appendingPathComponent(key as String)
        if let data = try? Data(contentsOf: fileURL),
            let route = try? decoder.decode(DisplayRoute.self, from: data)
        {
            cache.setObject(data as NSData, forKey: key, cost: data.count)
            return route
        }

        return nil
    }

    func clearCache() {
        cache.removeAllObjects()

        queue.async {
            try? self.fileManager.removeItem(at: self.cacheDirectory)
            self.setupDirectory()
        }
    }
}
