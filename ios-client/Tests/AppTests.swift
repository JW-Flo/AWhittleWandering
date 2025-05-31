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

    func testFallbackAlertManager() {
        let fallbackAlertManager = FallbackAlertManager.shared
        fallbackAlertManager.triggerCriticalAlert(forSoC: 5.0)
        // Verify alert logic (mock audio player or fallback list display)
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
