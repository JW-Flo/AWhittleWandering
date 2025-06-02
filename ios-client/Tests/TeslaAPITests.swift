import MCPClient  // Ensure the correct module is imported
import XCTest

final class TeslaAPITests: XCTestCase {
    var teslaAPI: TeslaAPI!
    
    override func setUp() {
        super.setUp()
        teslaAPI = TeslaAPI()
    }
    
    override func tearDown() {
        teslaAPI = nil
        super.tearDown()
    }

    func testAuthentication() {
        let expectation = self.expectation(description: "Authentication should succeed")
        
        teslaAPI.authenticate(username: "test@example.com", password: "password123") { success, error in
            XCTAssertTrue(success == true, "Authentication failed")
            XCTAssertNil(error, "Error should be nil")
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 5, handler: nil)
    }

    func testVehicleState() {
        let expectation = self.expectation(description: "Vehicle state fetch should succeed")
        
        teslaAPI.getVehicleState(vehicleId: "12345") { state, error in
            XCTAssertNotNil(state, "Vehicle state should not be nil")
            XCTAssertNil(error, "Error should be nil")
            XCTAssertNotNil(state?.batteryLevel, "Battery level should be available")
            XCTAssertNotNil(state?.chargeState, "Charge state should be available")
            XCTAssertNotNil(state?.climateState, "Climate state should be available")
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 5, handler: nil)
    }

    func testNavigationRequest() {
        let expectation = self.expectation(description: "Navigation request should succeed")
        
        teslaAPI.navigateTo(latitude: 37.7749, longitude: -122.4194) { success, error in
            XCTAssertTrue(success == true, "Navigation request failed")
            XCTAssertNil(error, "Error should be nil")
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 5, handler: nil)
    }
    
    func testChargingStationSearch() {
        let expectation = self.expectation(description: "Charging station search should succeed")
        let location = ["latitude": 37.7749, "longitude": -122.4194]
        
        teslaAPI.findNearbyChargingStations(near: location, radius: 50) { stations, error in
            XCTAssertNotNil(stations, "Charging stations should not be nil")
            XCTAssertNil(error, "Error should be nil")
            XCTAssertGreaterThan(stations?.count ?? 0, 0, "Should find at least one charging station")
            
            if let firstStation = stations?.first {
                XCTAssertNotNil(firstStation.location, "Station should have location")
                XCTAssertNotNil(firstStation.availability, "Station should have availability info")
                XCTAssertNotNil(firstStation.powerKW, "Station should have power rating")
            }
            
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 5, handler: nil)
    }
    
    func testWeatherAwareRouteOptimization() {
        let expectation = self.expectation(description: "Route optimization should succeed")
        let origin = ["latitude": 37.7749, "longitude": -122.4194]
        let destination = ["latitude": 34.0522, "longitude": -118.2437]
        
        teslaAPI.optimizeRoute(from: origin, to: destination, considerWeather: true) { route, error in
            XCTAssertNotNil(route, "Route should not be nil")
            XCTAssertNil(error, "Error should be nil")
            XCTAssertGreaterThan(route?.chargingStops.count ?? 0, 0, "Should include charging stops")
            XCTAssertNotNil(route?.weatherConditions, "Should include weather conditions")
            XCTAssertNotNil(route?.estimatedConsumption, "Should include energy consumption estimate")
            
            if let weatherConditions = route?.weatherConditions {
                XCTAssertGreaterThanOrEqual(weatherConditions.count, route?.segments.count ?? 0,
                    "Should have weather data for each route segment")
            }
            
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 5, handler: nil)
    }
}
