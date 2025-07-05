import CoreData
import XCTest

@testable import MCPClient

class OfflineTests: XCTestCase {
    var offlineManager: OfflineManager!
    var testContainer: NSPersistentContainer!

    override func setUp() {
        super.setUp()
        offlineManager = OfflineManager.shared
        setupTestCoreData()
    }

    override func tearDown() {
        offlineManager = nil
        clearTestCoreData()
        super.tearDown()
    }

    func testRouteCaching() {
        let expectation = self.expectation(description: "Route should be cached")
        let testRoute = Route(
            id: "test-route-1",
            origin: Location(latitude: 37.7749, longitude: -122.4194),
            destination: Location(latitude: 34.0522, longitude: -118.2437),
            segments: [],
            totalDistance: 383.0,
            totalDuration: 21600,
            weatherRisk: 0.2
        )

        offlineManager.cacheRoute(testRoute) { success in
            XCTAssertTrue(success, "Route should be cached successfully")

            self.offlineManager.fetchCachedRoute(id: "test-route-1") { route in
                XCTAssertNotNil(route, "Cached route should be retrievable")
                XCTAssertEqual(route?.id, testRoute.id, "Retrieved route should match cached route")
                XCTAssertEqual(
                    route?.totalDistance, testRoute.totalDistance,
                    "Route distance should be preserved")
                expectation.fulfill()
            }
        }

        waitForExpectations(timeout: 5, handler: nil)
    }

    func testMapTilePrefetching() {
        let expectation = self.expectation(description: "Map tiles should be prefetched")
        let route = Route(
            id: "test-route-2",
            origin: Location(latitude: 37.7749, longitude: -122.4194),
            destination: Location(latitude: 34.0522, longitude: -118.2437),
            segments: [],
            totalDistance: 383.0,
            totalDuration: 21600,
            weatherRisk: 0.2
        )

        offlineManager.prefetchMapTilesForRoute(route, zoomLevels: [12, 13, 14]) { progress in
            if progress == 1.0 {
                self.offlineManager.areMapTilesCached(forRoute: route, zoomLevel: 13) { cached in
                    XCTAssertTrue(cached, "Map tiles should be cached for the route")
                    expectation.fulfill()
                }
            }
        }

        waitForExpectations(timeout: 30, handler: nil)
    }

    func testWeatherDataCaching() {
        let expectation = self.expectation(description: "Weather data should be cached")
        let location = Location(latitude: 37.7749, longitude: -122.4194)

        offlineManager.cacheWeatherData(for: location) { success in
            XCTAssertTrue(success, "Weather data should be cached successfully")

            self.offlineManager.getCachedWeatherData(for: location) { weatherData in
                XCTAssertNotNil(weatherData, "Weather data should be retrievable from cache")
                XCTAssertNotNil(weatherData?.forecast, "Forecast data should be included")
                XCTAssertNotNil(weatherData?.alerts, "Weather alerts should be included")
                XCTAssertNotNil(weatherData?.timestamp, "Cache timestamp should be included")
                expectation.fulfill()
            }
        }

        waitForExpectations(timeout: 5, handler: nil)
    }

    func testConnectionStateManagement() {
        let expectation = self.expectation(
            description: "Connection state changes should be handled")

        // Simulate offline mode
        offlineManager.setNetworkState(.offline)
        XCTAssertTrue(offlineManager.isOffline, "Manager should recognize offline state")

        // Verify offline behavior
        offlineManager.getCurrentWeatherRisk(at: Location(latitude: 37.7749, longitude: -122.4194))
        { risk in
            XCTAssertNotNil(risk, "Should get cached weather risk in offline mode")
            XCTAssertTrue(risk?.isFromCache ?? false, "Weather risk should be marked as from cache")
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5, handler: nil)
    }

    func testSyncQueueManagement() {
        let expectation = self.expectation(description: "Sync queue should handle offline data")

        // Add items to sync queue
        let visit = Visit(latitude: 37.7749, longitude: -122.4194, timestamp: Date())
        offlineManager.queueForSync(visit)

        // Verify queue state
        XCTAssertEqual(offlineManager.pendingSyncCount, 1, "Visit should be queued for sync")

        // Simulate coming online
        offlineManager.setNetworkState(.online)
        offlineManager.processSyncQueue { success in
            XCTAssertTrue(success, "Sync queue should process successfully")
            XCTAssertEqual(
                self.offlineManager.pendingSyncCount, 0,
                "Sync queue should be empty after processing")
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5, handler: nil)
    }

    // MARK: - Helper Methods

    private func setupTestCoreData() {
        let container = NSPersistentContainer(name: "TestStore")
        let description = NSPersistentStoreDescription()
        description.type = NSInMemoryStoreType
        container.persistentStoreDescriptions = [description]

        container.loadPersistentStores { _, error in
            XCTAssertNil(error, "Failed to load test store: \(String(describing: error))")
        }

        testContainer = container
        offlineManager.setPersistentContainer(testContainer)
    }

    private func clearTestCoreData() {
        guard let store = testContainer.persistentStoreCoordinator.persistentStores.first else {
            return
        }
        try? testContainer.persistentStoreCoordinator.remove(store)
    }
}
