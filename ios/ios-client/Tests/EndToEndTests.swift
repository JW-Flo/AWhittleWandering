import XCTest
import MapboxMaps
import MapboxNavigation
import Combine
import CoreLocation
@testable import ContinentalUSA

/// End-to-End Integration Tests
/// Tests complete user flows and all integrations
class EndToEndTests: XCTestCase {
    
    // Test components
    private var app: OptimizedContinentalUSAApp!
    private var mapView: MapView!
    private var weatherService: WeatherService!
    private var teslaService: TeslaService!
    private var chargingService: ChargingService!
    private var routeManager: RouteManager!
    private var cancellables: Set<AnyCancellable> = []
    
    // Test data
    private let startLocation = CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060) // NYC
    private let endLocation = CLLocationCoordinate2D(latitude: 34.0522, longitude: -118.2437)  // LA
    private let testVehicleId = "TESLAVIN123456789"
    
    override func setUp() {
        super.setUp()
        
        // Initialize all services
        app = OptimizedContinentalUSAApp()
        mapView = MapView(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        weatherService = WeatherService.shared
        teslaService = TeslaService.shared
        chargingService = ChargingService.shared
        routeManager = RouteManager.shared
        
        // Configure all services
        APIEndpoints.configureAllServices()
    }
    
    func testCompleteUserJourney() async throws {
        // 1. Test App Launch & Configuration
        try await testAppLaunch()
        
        // 2. Test Map Loading & Initial Setup
        try await testMapInitialization()
        
        // 3. Test Weather Integration
        try await testWeatherIntegration()
        
        // 4. Test Tesla Integration
        try await testTeslaIntegration()
        
        // 5. Test Route Planning
        try await testRoutePlanning()
        
        // 6. Test Charging Station Integration
        try await testChargingStations()
        
        // 7. Test Navigation
        try await testNavigation()
        
        // 8. Test Data Persistence
        try await testDataPersistence()
        
        // 9. Test Analytics
        try await testAnalytics()
    }
    
    // MARK: - Individual Test Components
    
    private func testAppLaunch() async throws {
        let expectation = XCTestExpectation(description: "App launch")
        
        // Test app initialization
        XCTAssertNotNil(app)
        
        // Verify configuration
        try APIEndpoints.validateConfigurations()
        
        // Test initial state
        let state = await app.store.state
        XCTAssertNotNil(state)
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 5)
    }
    
    private func testMapInitialization() async throws {
        let expectation = XCTestExpectation(description: "Map initialization")
        
        // Test map loading
        mapView.mapboxMap.onNext(.mapLoaded) { _ in
            expectation.fulfill()
        }
        
        await fulfillment(of: [expectation], timeout: 10)
        XCTAssertTrue(mapView.mapboxMap.isLoaded)
        
        // Test style loading
        try await mapView.mapboxMap.loadStyleURI(.streets)
        XCTAssertNotNil(mapView.mapboxMap.style)
        
        // Test location services
        let locationManager = mapView.location
        XCTAssertNotNil(locationManager)
    }
    
    private func testWeatherIntegration() async throws {
        let expectation = XCTestExpectation(description: "Weather data")
        
        // Test weather data fetch
        let forecast = try await weatherService.getForecast(
            latitude: startLocation.latitude,
            longitude: startLocation.longitude
        )
        
        XCTAssertNotNil(forecast)
        XCTAssertFalse(forecast.periods.isEmpty)
        
        // Test weather alerts
        let alerts = try await weatherService.getAlerts(
            latitude: startLocation.latitude,
            longitude: startLocation.longitude
        )
        
        XCTAssertNotNil(alerts)
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 10)
    }
    
    private func testTeslaIntegration() async throws {
        let expectation = XCTestExpectation(description: "Tesla integration")
        
        // Test authentication
        let auth = try await teslaService.authenticate()
        XCTAssertNotNil(auth.accessToken)
        
        // Test vehicle data
        let vehicle = try await teslaService.getVehicle(id: testVehicleId)
        XCTAssertNotNil(vehicle)
        
        // Test vehicle state
        let state = try await teslaService.getVehicleState(id: testVehicleId)
        XCTAssertNotNil(state)
        
        // Test charging state
        let charging = try await teslaService.getChargingState(id: testVehicleId)
        XCTAssertNotNil(charging)
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 15)
    }
    
    private func testRoutePlanning() async throws {
        let expectation = XCTestExpectation(description: "Route planning")
        
        // Calculate route
        let route = try await routeManager.calculateRoute(
            from: startLocation,
            to: endLocation
        )
        
        XCTAssertNotNil(route)
        XCTAssertGreaterThan(route.distance, 0)
        
        // Test route optimization
        let optimizedRoute = try await routeManager.optimizeRoute(route)
        XCTAssertNotNil(optimizedRoute)
        
        // Test waypoints
        let waypoints = try await routeManager.generateWaypoints(for: optimizedRoute)
        XCTAssertFalse(waypoints.isEmpty)
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 15)
    }
    
    private func testChargingStations() async throws {
        let expectation = XCTestExpectation(description: "Charging stations")
        
        // Search for stations
        let stations = try await chargingService.searchStations(
            latitude: startLocation.latitude,
            longitude: startLocation.longitude,
            radius: 50
        )
        
        XCTAssertFalse(stations.isEmpty)
        
        // Test station details
        if let station = stations.first {
            let details = try await chargingService.getStationDetails(id: station.id)
            XCTAssertNotNil(details)
            
            // Test availability
            let availability = try await chargingService.checkAvailability(id: station.id)
            XCTAssertNotNil(availability)
        }
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 10)
    }
    
    private func testNavigation() async throws {
        let expectation = XCTestExpectation(description: "Navigation")
        
        // Initialize navigation
        let navigationService = MapboxNavigationService(route: try await routeManager.currentRoute())
        XCTAssertNotNil(navigationService)
        
        // Test route progress
        navigationService.start()
        
        // Monitor progress
        navigationService.routeProgress
            .sink { progress in
                XCTAssertNotNil(progress)
                XCTAssertGreaterThanOrEqual(progress.fractionCompleted, 0)
            }
            .store(in: &cancellables)
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 10)
    }
    
    private func testDataPersistence() async throws {
        let expectation = XCTestExpectation(description: "Data persistence")
        
        // Test trip data persistence
        let trip = TripData(
            startLocation: startLocation,
            endLocation: endLocation,
            startDate: Date()
        )
        
        try await DataManager.shared.saveTrip(trip)
        
        // Verify persistence
        let savedTrip = try await DataManager.shared.getTrip(id: trip.id)
        XCTAssertNotNil(savedTrip)
        
        // Test offline data
        try await OfflineManager.shared.downloadOfflineData(for: trip)
        let offlineData = try await OfflineManager.shared.getOfflineData(for: trip)
        XCTAssertNotNil(offlineData)
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 10)
    }
    
    private func testAnalytics() async throws {
        let expectation = XCTestExpectation(description: "Analytics")
        
        // Test analytics events
        Analytics.shared.logEvent("test_journey_complete", parameters: [
            "start": "\(startLocation.latitude),\(startLocation.longitude)",
            "end": "\(endLocation.latitude),\(endLocation.longitude)"
        ])
        
        // Test crash reporting
        Crashlytics.crashlytics().log("Test journey completed successfully")
        
        // Test performance monitoring
        Performance.startTrace(name: "test_complete_journey")
        Performance.stopTrace(name: "test_complete_journey")
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 5)
    }
}
