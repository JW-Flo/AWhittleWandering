import XCTest
import Combine
@testable import ContinentalUSA

/// Real API Integration Tests
/// Tests actual API integrations used by the web application
class RealAPIIntegrationTests: XCTestCase {
    
    private var cancellables: Set<AnyCancellable> = []
    
    // Test data
    private let testVehicleId = "TESLAVIN123456789"
    private let nyc = CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060)
    private let la = CLLocationCoordinate2D(latitude: 34.0522, longitude: -118.2437)
    
    override func setUp() {
        super.setUp()
        RealAPIEndpoints.configureAllServices()
    }
    
    // MARK: - Tessie API Tests
    
    func testTessieFleetAPI() async throws {
        let expectation = XCTestExpectation(description: "Tessie Fleet API")
        
        // Test fleet data access
        let fleet = try await TessieService.shared.getFleetData()
        XCTAssertNotNil(fleet)
        XCTAssertFalse(fleet.vehicles.isEmpty)
        
        // Test vehicle details
        if let vehicle = fleet.vehicles.first {
            let details = try await TessieService.shared.getVehicleDetails(id: vehicle.id)
            XCTAssertNotNil(details)
            XCTAssertNotNil(details.batteryLevel)
            XCTAssertNotNil(details.chargeState)
        }
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 10)
    }
    
    func testTessieTelemetry() async throws {
        let expectation = XCTestExpectation(description: "Tessie Telemetry")
        
        // Connect to WebSocket
        TessieService.shared.connectToTelemetry()
            .sink { completion in
                if case .failure(let error) = completion {
                    XCTFail("Telemetry failed: \(error)")
                }
            } receiveValue: { telemetry in
                XCTAssertNotNil(telemetry)
                XCTAssertNotNil(telemetry.timestamp)
                XCTAssertNotNil(telemetry.location)
                expectation.fulfill()
            }
            .store(in: &cancellables)
        
        await fulfillment(of: [expectation], timeout: 15)
    }
    
    // MARK: - ABRP Tests
    
    func testABRPRouteOptimization() async throws {
        let expectation = XCTestExpectation(description: "ABRP Route")
        
        // Test route planning
        let route = try await ABRPService.shared.planRoute(
            from: nyc,
            to: la,
            batteryLevel: 90,
            vehicleModel: "tesla_model3_2021"
        )
        
        XCTAssertNotNil(route)
        XCTAssertFalse(route.chargingStops.isEmpty)
        
        // Verify charging stops
        for stop in route.chargingStops {
            XCTAssertNotNil(stop.location)
            XCTAssertNotNil(stop.duration)
            XCTAssertGreaterThan(stop.targetBatteryLevel, stop.arrivalBatteryLevel)
        }
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 15)
    }
    
    func testABRPTelemetry() async throws {
        let expectation = XCTestExpectation(description: "ABRP Telemetry")
        
        // Send telemetry data
        try await ABRPService.shared.sendTelemetry(
            location: nyc,
            batteryLevel: 85,
            speed: 65,
            temperature: 72
        )
        
        // Verify telemetry was received
        let status = try await ABRPService.shared.getTelemetryStatus()
        XCTAssertEqual(status.status, "ok")
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 10)
    }
    
    // MARK: - Weather Service Tests
    
    func testNWSWeatherData() async throws {
        let expectation = XCTestExpectation(description: "NWS Weather")
        
        // Get nearest station
        let stations = try await WeatherService.shared.getNearestStations(
            latitude: nyc.latitude,
            longitude: nyc.longitude
        )
        XCTAssertFalse(stations.isEmpty)
        
        // Get station data
        if let station = stations.first {
            let observations = try await WeatherService.shared.getStationObservations(
                stationId: station.id
            )
            XCTAssertNotNil(observations)
            XCTAssertNotNil(observations.temperature)
            XCTAssertNotNil(observations.windSpeed)
        }
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 10)
    }
    
    // MARK: - Cloudflare Worker Tests
    
    func testCloudflareRouteTracking() async throws {
        let expectation = XCTestExpectation(description: "Route Tracking")
        
        // Create trip
        let trip = try await CloudflareService.shared.createTrip(
            start: nyc,
            end: la
        )
        XCTAssertNotNil(trip)
        
        // Update location
        try await CloudflareService.shared.updateLocation(
            tripId: trip.id,
            location: nyc,
            batteryLevel: 90,
            speed: 65
        )
        
        // Verify sync
        let syncStatus = try await CloudflareService.shared.getSyncStatus(tripId: trip.id)
        XCTAssertEqual(syncStatus.status, "synced")
        
        expectation.fulfill()
        await fulfillment(of: [expectation], timeout: 15)
    }
    
    // MARK: - End-to-End Integration Test
    
    func testCompleteJourney() async throws {
        // 1. Get vehicle data from Tessie
        let fleet = try await TessieService.shared.getFleetData()
        XCTAssertFalse(fleet.vehicles.isEmpty)
        
        // 2. Plan route with ABRP
        let route = try await ABRPService.shared.planRoute(
            from: nyc,
            to: la,
            batteryLevel: fleet.vehicles[0].batteryLevel,
            vehicleModel: "tesla_model3_2021"
        )
        XCTAssertNotNil(route)
        
        // 3. Get weather for first charging stop
        if let firstStop = route.chargingStops.first {
            let weather = try await WeatherService.shared.getNearestStations(
                latitude: firstStop.location.latitude,
                longitude: firstStop.location.longitude
            )
            XCTAssertFalse(weather.isEmpty)
        }
        
        // 4. Create trip in Cloudflare
        let trip = try await CloudflareService.shared.createTrip(
            start: nyc,
            end: la
        )
        XCTAssertNotNil(trip)
        
        // 5. Start telemetry streaming
        let telemetryExpectation = XCTestExpectation(description: "Telemetry")
        
        TessieService.shared.connectToTelemetry()
            .sink { completion in
                if case .failure(let error) = completion {
                    XCTFail("Telemetry failed: \(error)")
                }
            } receiveValue: { telemetry in
                // Send to ABRP
                Task {
                    try await ABRPService.shared.sendTelemetry(
                        location: telemetry.location,
                        batteryLevel: telemetry.batteryLevel,
                        speed: telemetry.speed,
                        temperature: telemetry.temperature
                    )
                    
                    // Update Cloudflare
                    try await CloudflareService.shared.updateLocation(
                        tripId: trip.id,
                        location: telemetry.location,
                        batteryLevel: telemetry.batteryLevel,
                        speed: telemetry.speed
                    )
                }
                
                telemetryExpectation.fulfill()
            }
            .store(in: &cancellables)
        
        await fulfillment(of: [telemetryExpectation], timeout: 30)
    }
}
