@testable import MCPClient

#if canImport(XCTest)
    import XCTest
#endif

class AppTests: XCTestCase {

    func testVisitLogger() {
        let visitLogger = VisitLogger()
        let mockVisit = CLVisit()
        visitLogger.bufferVisit(mockVisit)
        XCTAssertEqual(visitLogger.visitBuffer.count, 1, "Visit should be buffered.")
    }

    func testChargingIntelligence() {
        let chargingIntelligence = ChargingIntelligence()
        chargingIntelligence.fetchStateOfCharge(vehicleID: "12345", accessToken: "mockToken")
        XCTAssertNotNil(chargingIntelligence.stateOfCharge, "State of Charge should be fetched.")
    }

    func testEdgeWorkerIntegration() {
        let edgeWorker = EdgeWorkerIntegration.shared
        let mockVisits = [["latitude": 37.7749, "longitude": -122.4194]]
        let expectation = self.expectation(description: "Sync should complete.")

        edgeWorker.syncVisits(visits: mockVisits, hmacKey: "mockKey") { success in
            XCTAssertTrue(success, "Sync should succeed.")
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5, handler: nil)
    }

    func testOfflineManager() {
        let offlineManager = OfflineManager.shared
        offlineManager.cacheVisit(["latitude": 37.7749, "longitude": -122.4194])
        XCTAssertEqual(offlineManager.visitQueue.count, 1, "Visit should be cached.")
    }

    func testWeatherRiskCalculation() {
        let edgeWorker = EdgeWorkerIntegration.shared
        let testLocation = ["latitude": 37.7749, "longitude": -122.4194]
        let expectation = self.expectation(description: "Weather risk calculation should complete")

        edgeWorker.calculateWeatherRisk(at: testLocation) { risk, error in
            XCTAssertNotNil(risk, "Weather risk should not be nil")
            XCTAssertNil(error, "Error should be nil")
            XCTAssertGreaterThanOrEqual(risk?.severity ?? 0, 0, "Risk severity should be >= 0")
            XCTAssertLessThanOrEqual(risk?.severity ?? 5, 5, "Risk severity should be <= 5")
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5, handler: nil)
    }

    func testRoutePlanningWithWeather() {
        let tripAnalytics = TripAnalytics.shared
        let origin = ["latitude": 37.7749, "longitude": -122.4194]
        let destination = ["latitude": 34.0522, "longitude": -118.2437]
        let expectation = self.expectation(description: "Route planning should complete")

        tripAnalytics.planRouteWithWeather(from: origin, to: destination) { route, error in
            XCTAssertNotNil(route, "Route should not be nil")
            XCTAssertNil(error, "Error should be nil")
            XCTAssertGreaterThan(route?.segments.count ?? 0, 0, "Route should have segments")
            XCTAssertNotNil(route?.weatherAdjustedRange, "Weather adjusted range should be calculated")
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5, handler: nil)
    }

    func testOfflineMapTileCache() {
        let offlineManager = OfflineManager.shared
        let testTileCoordinate = ["x": 1234, "y": 5678, "z": 15]
        let expectation = self.expectation(description: "Map tile caching should complete")

        offlineManager.cacheMapTile(coordinate: testTileCoordinate) { success in
            XCTAssertTrue(success, "Map tile should be cached successfully")
            XCTAssertTrue(offlineManager.isTileCached(coordinate: testTileCoordinate), "Tile should be marked as cached")
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5, handler: nil)
    }

    func testFallbackAlertManager() {
        let fallbackAlertManager = FallbackAlertManager.shared
        let expectation = self.expectation(description: "Alert should be triggered")

        fallbackAlertManager.triggerCriticalAlert(forSoC: 5.0) { success in
            XCTAssertTrue(success, "Alert should be triggered successfully")
            XCTAssertEqual(fallbackAlertManager.currentAlertLevel, .critical, "Alert level should be critical")
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5, handler: nil)
    }

    func testSettingsManager() {
        let settingsManager = SettingsManager.shared
        settingsManager.updateLowSoCThreshold(to: 10.0)
        XCTAssertEqual(
            settingsManager.lowSoCThreshold, 10.0, "Low SoC threshold should be updated.")
    }

    func testTripAnalytics() {
        let tripAnalytics = TripAnalytics.shared
        tripAnalytics.logTripSegment(mileage: 100.0)
        XCTAssertEqual(
            tripAnalytics.getAnalyticsSummary().contains("100.0 miles"), true,
            "Analytics summary should include mileage.")
    }
}
