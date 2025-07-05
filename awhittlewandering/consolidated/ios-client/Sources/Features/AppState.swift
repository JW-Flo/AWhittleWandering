import Foundation
import Combine
import CoreLocation

public class AppState: ObservableObject {
    // Published properties for UI updates
    @Published public private(set) var currentVehicle: VehicleData?
    @Published public private(set) var currentTrip: TripData?
    @Published public private(set) var currentRoute: DisplayRoute?
    @Published public private(set) var nearbyChargingStations: [ChargingStation] = []
    @Published public private(set) var isOfflineMode: Bool = false
    @Published public private(set) var networkError: Error?
    
    // State management
    @Published public private(set) var isLoading: Bool = false
    @Published public private(set) var lastSyncTimestamp: Date?
    
    // Location manager for vehicle tracking
    private let locationManager: CLLocationManager
    private var cancellables = Set<AnyCancellable>()
    
    public init() {
        self.locationManager = CLLocationManager()
        setupLocationTracking()
        setupNetworkMonitoring()
    }
    
    // MARK: - Location Tracking
    
    private func setupLocationTracking() {
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = true
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        
        // Request authorization
        locationManager.requestWhenInUseAuthorization()
    }
    
    // MARK: - Network Monitoring
    
    private func setupNetworkMonitoring() {
        // Monitor network connectivity changes
        // Implementation will be added when we create NetworkManager
    }
    
    // MARK: - Public Methods
    
    public func startTrip() async throws {
        isLoading = true
        defer { isLoading = false }
        
        // Implementation will be added when we create TripManager
    }
    
    public func updateVehicleStatus() async throws {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        
        // Implementation will be added when we create VehicleManager
    }
    
    public func fetchNearbyChargingStations() async throws {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        
        // Implementation will be added when we create ChargingStationManager
    }
    
    public func optimizeRoute() async throws {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        
        // Implementation will be added when we create RouteOptimizer
    }
    
    // MARK: - Error Handling
    
    private func handleError(_ error: Error) {
        networkError = error
        // Log error and potentially trigger offline mode if needed
    }
    
    // MARK: - Offline Support
    
    public func enableOfflineMode() {
        isOfflineMode = true
        // Implementation will be added when we create OfflineManager
    }
    
    public func disableOfflineMode() {
        isOfflineMode = false
        // Trigger sync when coming back online
    }
    
    // MARK: - Background Tasks
    
    public func registerBackgroundTasks() {
        // Register background tasks for location updates and data sync
        // Implementation will be added when we create BackgroundTaskManager
    }
}

// MARK: - Preview Helper

extension AppState {
    public static var preview: AppState {
        let state = AppState()
        state.currentVehicle = VehicleData(
            vehicleId: "PREVIEW123",
            location: LocationCoordinate(latitude: 37.7749, longitude: -122.4194),
            batteryLevel: 75.0,
            range: 250.0,
            speed: 65.0,
            charging: false
        )
        state.currentTrip = TripData(
            tripId: "TRIP123",
            startDate: Date(),
            currentDay: 1,
            statesVisited: ["CA"],
            milesCompleted: 150.0,
            milesRemaining: 2850.0,
            currentState: "CA"
        )
        state.currentRoute = DisplayRoute.preview
        return state
    }
}
