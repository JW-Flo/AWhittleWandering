import XCTest
@testable import ContinentalUSA

/// Service Integration Tests
/// Validates all API endpoints, configurations, and integrations
class ServiceIntegrationTests: XCTestCase {
    
    // MARK: - Setup
    
    override func setUp() {
        super.setUp()
        // Configure all services before testing
        APIEndpoints.configureAllServices()
    }
    
    // MARK: - Mapbox Integration Tests
    
    func testMapboxConfiguration() {
        let expectation = XCTestExpectation(description: "Mapbox initialization")
        
        // Test map initialization
        let mapView = MapView(frame: .zero)
        mapView.mapboxMap.onNext(.mapLoaded) { _ in
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 5.0)
        XCTAssertTrue(mapView.mapboxMap.isLoaded)
    }
    
    func testMapboxDirections() {
        let expectation = XCTestExpectation(description: "Route calculation")
        
        // NYC to LA coordinates
        let origin = CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060)
        let destination = CLLocationCoordinate2D(latitude: 34.0522, longitude: -118.2437)
        
        MapboxDirections.shared.calculateRoute(from: origin, to: destination) { result in
            switch result {
            case .success(let route):
                XCTAssertNotNil(route)
                XCTAssertGreaterThan(route.distance, 0)
                expectation.fulfill()
            case .failure(let error):
                XCTFail("Route calculation failed: \(error)")
            }
        }
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    // MARK: - Weather Service Tests
    
    func testWeatherServiceConfiguration() {
        let expectation = XCTestExpectation(description: "Weather data fetch")
        
        // Test weather data fetch for NYC
        WeatherService.shared.getForecast(
            latitude: 40.7128,
            longitude: -74.0060
        ) { result in
            switch result {
            case .success(let forecast):
                XCTAssertNotNil(forecast)
                XCTAssertFalse(forecast.periods.isEmpty)
                expectation.fulfill()
            case .failure(let error):
                XCTFail("Weather fetch failed: \(error)")
            }
        }
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    // MARK: - Tesla Integration Tests
    
    func testTeslaAuthentication() {
        let expectation = XCTestExpectation(description: "Tesla authentication")
        
        TeslaService.shared.authenticate { result in
            switch result {
            case .success(let auth):
                XCTAssertNotNil(auth.accessToken)
                XCTAssertNotNil(auth.refreshToken)
                expectation.fulfill()
            case .failure(let error):
                XCTFail("Tesla authentication failed: \(error)")
            }
        }
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    func testTeslaVehicleData() {
        let expectation = XCTestExpectation(description: "Vehicle data fetch")
        
        TeslaService.shared.getVehicles { result in
            switch result {
            case .success(let vehicles):
                XCTAssertFalse(vehicles.isEmpty)
                expectation.fulfill()
            case .failure(let error):
                XCTFail("Vehicle data fetch failed: \(error)")
            }
        }
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    // MARK: - Charging Station Tests
    
    func testChargingStationSearch() {
        let expectation = XCTestExpectation(description: "Charging station search")
        
        // Search around NYC
        ChargingService.shared.searchStations(
            latitude: 40.7128,
            longitude: -74.0060,
            radius: 50
        ) { result in
            switch result {
            case .success(let stations):
                XCTAssertFalse(stations.isEmpty)
                expectation.fulfill()
            case .failure(let error):
                XCTFail("Station search failed: \(error)")
            }
        }
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    // MARK: - Analytics Integration Tests
    
    func testAnalyticsConfiguration() {
        // Test Firebase
        XCTAssertNotNil(Analytics.shared)
        XCTAssertTrue(Analytics.shared.isConfigured)
        
        // Test Amplitude
        XCTAssertNotNil(Amplitude.instance())
        XCTAssertTrue(Amplitude.instance().apiKey != nil)
        
        // Test Bugsnag
        XCTAssertTrue(Bugsnag.isStarted())
    }
    
    // MARK: - End-to-End Integration Test
    
    func testCompleteUserJourney() {
        // 1. Initialize map
        let mapExpectation = XCTestExpectation(description: "Map loaded")
        let mapView = MapView(frame: .zero)
        mapView.mapboxMap.onNext(.mapLoaded) { _ in
            mapExpectation.fulfill()
        }
        
        // 2. Get weather data
        let weatherExpectation = XCTestExpectation(description: "Weather loaded")
        WeatherService.shared.getForecast(latitude: 40.7128, longitude: -74.0060) { result in
            if case .success = result {
                weatherExpectation.fulfill()
            }
        }
        
        // 3. Find charging stations
        let chargingExpectation = XCTestExpectation(description: "Stations found")
        ChargingService.shared.searchStations(
            latitude: 40.7128,
            longitude: -74.0060,
            radius: 50
        ) { result in
            if case .success = result {
                chargingExpectation.fulfill()
            }
        }
        
        // 4. Calculate route
        let routeExpectation = XCTestExpectation(description: "Route calculated")
        let origin = CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060)
        let destination = CLLocationCoordinate2D(latitude: 34.0522, longitude: -118.2437)
        
        MapboxDirections.shared.calculateRoute(from: origin, to: destination) { result in
            if case .success = result {
                routeExpectation.fulfill()
            }
        }
        
        // Wait for all operations to complete
        wait(
            for: [
                mapExpectation,
                weatherExpectation,
                chargingExpectation,
                routeExpectation
            ],
            timeout: 30.0,
            enforceOrder: true
        )
    }
}
