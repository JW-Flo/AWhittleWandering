import Foundation
import MapboxMaps
import CoreLocation
import Combine

public class MapManager: ObservableObject {
    public static let shared = MapManager()
    
    // MARK: - Published Properties
    
    @Published public private(set) var currentRoute: DisplayRoute?
    @Published public private(set) var chargingStations: [ChargingStation] = []
    @Published public private(set) var isNavigating = false
    @Published public private(set) var nextInstruction: String?
    @Published public private(set) var distanceToNextStop: Double?
    
    // MARK: - Private Properties
    
    private var mapView: MapView?
    private var navigationCamera: NavigationCamera?
    private var routeLineLayer: LineLayer?
    private var statePolygonLayer: FillLayer?
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Configuration
    
    private let routeLineWidth: Double = 4.0
    private let routeLineColor = UIColor.systemBlue
    private let visitedStateColor = UIColor.systemGreen.withAlphaComponent(0.3)
    private let unvisitedStateColor = UIColor.systemGray.withAlphaComponent(0.1)
    
    // MARK: - Initialization
    
    private init() {
        setupNotifications()
    }
    
    // MARK: - Public Methods
    
    public func configureMapView(_ mapView: MapView) {
        self.mapView = mapView
        setupMapLayers()
        setupGestures()
    }
    
    public func startNavigation(for route: DisplayRoute) {
        guard let mapView = mapView else { return }
        
        currentRoute = route
        isNavigating = true
        
        // Convert route coordinates to MapBox format
        let coordinates = route.coordinates.map { $0.toCLCoordinate }
        
        // Create route line
        drawRoute(coordinates: coordinates)
        
        // Add charging station annotations
        addChargingStationAnnotations(route.chargingStops)
        
        // Start turn-by-turn navigation
        startTurnByTurnNavigation(coordinates: coordinates)
        
        // Update camera to follow route
        followRoute(coordinates: coordinates)
    }
    
    public func stopNavigation() {
        isNavigating = false
        nextInstruction = nil
        distanceToNextStop = nil
        clearRoute()
    }
    
    public func updateVehicleLocation(_ location: CLLocationCoordinate2D) {
        guard isNavigating else { return }
        updateNavigationCamera(to: location)
    }
    
    // MARK: - Private Methods
    
    private func setupMapLayers() {
        guard let mapView = mapView else { return }
        
        // Setup route line layer
        routeLineLayer = LineLayer(id: "route-line")
        routeLineLayer?.lineWidth = .constant(routeLineWidth)
        routeLineLayer?.lineColor = .constant(routeLineColor.cgColor)
        
        // Setup state boundary layer
        statePolygonLayer = FillLayer(id: "state-boundaries")
        statePolygonLayer?.fillColor = .expression(
            Exp(.match) {
                Exp(.get) { "visited" }
                true
                UIColor.systemGreen.withAlphaComponent(0.3).cgColor
                UIColor.systemGray.withAlphaComponent(0.1).cgColor
            }
        )
        
        mapView.mapboxMap.style.addLayer(routeLineLayer!)
        mapView.mapboxMap.style.addLayer(statePolygonLayer!)
    }
    
    private func setupGestures() {
        // Add gesture recognizers for map interaction
    }
    
    private func drawRoute(coordinates: [CLLocationCoordinate2D]) {
        guard let routeLineLayer = routeLineLayer else { return }
        
        let lineString = LineString(coordinates)
        let feature = Feature(geometry: .lineString(lineString))
        let source = GeoJSONSource(id: "route-source")
        source.data = .feature(feature)
        
        try? mapView?.mapboxMap.style.addSource(source)
        routeLineLayer.source = "route-source"
    }
    
    private func addChargingStationAnnotations(_ stations: [ChargingStation]) {
        stations.forEach { station in
            let annotation = PointAnnotation(coordinate: station.location.clLocation)
            annotation.image = .init(image: UIImage(systemName: "bolt.circle.fill")!, name: "charging-station")
            mapView?.annotations.add(annotation)
        }
    }
    
    private func startTurnByTurnNavigation(coordinates: [CLLocationCoordinate2D]) {
        // Initialize turn-by-turn navigation
        // This will be implemented when we add voice guidance
    }
    
    private func followRoute(coordinates: [CLLocationCoordinate2D]) {
        guard let mapView = mapView else { return }
        
        let camera = mapView.camera
        camera.fly(to: CameraOptions(center: coordinates.first!, zoom: 15))
        
        navigationCamera = NavigationCamera(mapView: mapView)
        navigationCamera?.follow()
    }
    
    private func updateNavigationCamera(to location: CLLocationCoordinate2D) {
        navigationCamera?.update(to: location)
    }
    
    private func clearRoute() {
        guard let mapView = mapView else { return }
        
        try? mapView.mapboxMap.style.removeLayer(withId: "route-line")
        try? mapView.mapboxMap.style.removeSource(withId: "route-source")
        mapView.annotations.removeAll()
    }
    
    private func setupNotifications() {
        NotificationCenter.default.publisher(for: .networkStatusChanged)
            .sink { [weak self] notification in
                guard let isConnected = notification.userInfo?["isConnected"] as? Bool else { return }
                self?.handleConnectivityChange(isConnected: isConnected)
            }
            .store(in: &cancellables)
    }
    
    private func handleConnectivityChange(isConnected: Bool) {
        if !isConnected {
            // Switch to offline map style and cached data
        }
    }
}

// MARK: - Helper Extensions

extension CLLocationCoordinate2D {
    var locationCoordinate: LocationCoordinate {
        LocationCoordinate(latitude: latitude, longitude: longitude)
    }
}

extension NavigationCamera {
    func update(to coordinate: CLLocationCoordinate2D) {
        let options = CameraOptions(center: coordinate, zoom: 15)
        self.camera.ease(to: options, duration: 1.0)
    }
}
