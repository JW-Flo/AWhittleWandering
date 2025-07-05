import MapboxMaps
import SwiftUI
import Models
import Combine

/// EnhancedMapBoxView provides a MapBox SDK-based map view with support for weather overlays
/// and route visualization. It serves as the interface for the immersive weather integration
/// that BlackBox AI will implement.
struct EnhancedMapBoxView: UIViewRepresentable {
    // Configuration
    var initialCameraOptions: CameraOptions
    var styleURI: StyleURI
    var routes: [DisplayRoute]
    var showUserLocation: Bool = true
    var weatherOverlaysVisible: Bool = true
    var trafficVisible: Bool = false
    
    // Binding to selected route
    @Binding var selectedRoute: DisplayRoute?
    
    // Environment state
    @EnvironmentObject var appState: AppState
    
    // View model that handles weather overlays and map interactions
    @StateObject private var viewModel = EnhancedMapBoxViewModel()
    
    // MARK: - UIViewRepresentable Implementation
    
    func makeUIView(context: Context) -> MapView {
        // Configure MapBox view
        let options = MapInitOptions(
            resourceOptions: ResourceOptions(accessToken: appState.mapboxToken),
            cameraOptions: initialCameraOptions,
            styleURI: styleURI
        )
        
        // Create MapBox view
        let mapView = MapView(frame: .zero, mapInitOptions: options)
        
        // Set up location puck (user location indicator)
        if showUserLocation {
            configureLocationPuck(mapView: mapView)
        }
        
        // Set up map view model
        viewModel.setupMapView(mapView)
        
        // Add gesture recognizers
        let gestureRecognizer = UITapGestureRecognizer(
            target: context.coordinator,
            action: #selector(Coordinator.handleMapTap(_:))
        )
        mapView.addGestureRecognizer(gestureRecognizer)
        
        // Store coordinator reference for callbacks
        context.coordinator.mapView = mapView
        context.coordinator.viewModel = viewModel
        context.coordinator.parent = self
        
        return mapView
    }
    
    func updateUIView(_ mapView: MapView, context: Context) {
        // Update routes on the map
        updateRoutes(mapView: mapView)
        
        // Update weather overlays visibility
        viewModel.setWeatherOverlaysVisible(weatherOverlaysVisible)
        
        // Update traffic layer visibility
        viewModel.setTrafficVisible(trafficVisible)
        
        // Update selected route
        if let selectedRoute = selectedRoute {
            viewModel.highlightRoute(with: selectedRoute.id)
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }
    
    // MARK: - Configuration Methods
    
    private func configureLocationPuck(mapView: MapView) {
        // Configure user location puck (the blue dot showing user location)
        var puckConfig = Puck2DConfiguration(
            topImage: UIImage(systemName: "location.fill"),
            bearingImage: UIImage(systemName: "location.north.fill"),
            shadowImage: nil,
            scale: 0.8
        )
        puckConfig.showsAccuracyRing = true
        
        try? mapView.location.setLocationProvider(
            AppleLocationProvider(locationManager: CLLocationManager())
        )
        mapView.location.options.puckType = .puck2D(puckConfig)
        mapView.location.options.puckBearingSource = .heading
    }
    
    private func updateRoutes(mapView: MapView) {
        viewModel.clearRoutes()
        
        for route in routes {
            // Convert route coordinates to MapBox format
            let coordinates = route.coordinates.map { coordinate in
                CLLocationCoordinate2D(latitude: coordinate.latitude, longitude: coordinate.longitude)
            }
            
            // Determine route color based on weather risk
            let routeColor: UIColor
            switch route.weatherRisk {
            case 0..<0.3:
                routeColor = .systemGreen
            case 0.3..<0.7:
                routeColor = .systemYellow
            default:
                routeColor = .systemRed
            }
            
            // Add route to the map
            viewModel.addRoute(
                id: route.id,
                coordinates: coordinates,
                lineColor: routeColor,
                lineWidth: route.id == selectedRoute?.id ? 6.0 : 3.0
            )
        }
    }
    
    // MARK: - Coordinator
    
    class Coordinator: NSObject {
        var mapView: MapView?
        var viewModel: EnhancedMapBoxViewModel?
        var parent: EnhancedMapBoxView?
        
        @objc func handleMapTap(_ gesture: UITapGestureRecognizer) {
            guard let mapView = mapView, let viewModel = viewModel, let parent = parent else { return }
            
            // Get the tap point
            let point = gesture.location(in: mapView)
            
            // Query for features at the tapped point
            let options = RenderedQueryOptions(layerIds: viewModel.routeLayerIds, filter: nil)
            
            mapView.mapboxMap.queryRenderedFeatures(
                at: point,
                options: options
            ) { result in
                switch result {
                case .success(let features):
                    if let feature = features.first,
                       let routeId = feature.feature.properties?["routeId"] as? String,
                       let route = parent.routes.first(where: { $0.id == routeId }) {
                        DispatchQueue.main.async {
                            parent.selectedRoute = route
                        }
                    }
                case .failure(let error):
                    print("Error querying features: \(error)")
                }
            }
        }
    }
}

// MARK: - ViewModel

class EnhancedMapBoxViewModel: ObservableObject {
    // Map view instance
    private var mapView: MapView?
    
    // Layer management
    private(set) var routeLayerIds: [String] = []
    private var weatherOverlayLayerIds: [String] = []
    private var weatherAlertAnnotations: [String: PointAnnotation] = [:]
    private var routeShapeSourceIds: [String] = []
    
    // Weather data
    private var weatherData: [String: Any]?
    
    // MapBox style loaded cancellable
    private var styleLoadedCancellable: AnyCancellable?
    
    // Annotation manager
    private var pointAnnotationManager: PointAnnotationManager?
    
    // MARK: - Setup
    
    func setupMapView(_ mapView: MapView) {
        self.mapView = mapView
        
        // Wait for style to be loaded before adding layers
        styleLoadedCancellable = mapView.mapboxMap.onStyleLoaded.sink { [weak self] _ in
            self?.setupMapLayers()
        }
    }
    
    private func setupMapLayers() {
        guard let mapView = mapView else { return }
        
        // Add empty sources for weather data
        do {
            // Create empty sources for different weather overlay types
            try mapView.mapboxMap.style.addSource(
                GeoJSONSource(id: "weather-temperature"),
                dataId: "weather-temperature"
            )
            
            try mapView.mapboxMap.style.addSource(
                GeoJSONSource(id: "weather-precipitation"),
                dataId: "weather-precipitation"
            )
            
            try mapView.mapboxMap.style.addSource(
                GeoJSONSource(id: "weather-alerts"),
                dataId: "weather-alerts"
            )
            
            // Initialize annotation manager for weather alerts
            pointAnnotationManager = mapView.annotations.makePointAnnotationManager()
            
        } catch {
            print("Error setting up map layers: \(error)")
        }
    }
    
    // MARK: - Route Management
    
    func addRoute(id: String, coordinates: [CLLocationCoordinate2D], lineColor: UIColor, lineWidth: Double) {
        guard let mapView = mapView, !coordinates.isEmpty else { return }
        
        let sourceId = "route-source-\(id)"
        let layerId = "route-layer-\(id)"
        
        do {
            // Create line string for the route
            var lineString = LineString([coordinates[0]])
            for coordinate in coordinates.dropFirst() {
                lineString.coordinates.append(coordinate)
            }
            
            // Create feature with properties for later identification
            var feature = Feature(geometry: .lineString(lineString))
            feature.properties = ["routeId": .string(id)]
            let featureCollection = FeatureCollection(features: [feature])
            
            // Add source for the route
            if !routeShapeSourceIds.contains(sourceId) {
                let source = GeoJSONSource(id: sourceId)
                try mapView.mapboxMap.style.addSource(source, dataId: sourceId)
                routeShapeSourceIds.append(sourceId)
            }
            
            // Update source data
            try mapView.mapboxMap.style.updateGeoJSONSource(withId: sourceId, geoJSON: .featureCollection(featureCollection))
            
            // Add or update layer for the route
            if !routeLayerIds.contains(layerId) {
                var lineLayer = LineLayer(id: layerId)
                lineLayer.source = sourceId
                lineLayer.lineColor = .constant(.color(lineColor))
                lineLayer.lineWidth = .constant(.number(Double(lineWidth)))
                lineLayer.lineCap = .constant(.round)
                lineLayer.lineJoin = .constant(.round)
                
                try mapView.mapboxMap.style.addLayer(lineLayer)
                routeLayerIds.append(layerId)
            } else {
                // Update existing layer properties
                try mapView.mapboxMap.style.setLayerProperty(
                    for: layerId,
                    property: "line-color",
                    value: lineColor.hexString
                )
                
                try mapView.mapboxMap.style.setLayerProperty(
                    for: layerId,
                    property: "line-width",
                    value: lineWidth
                )
            }
        } catch {
            print("Error adding route: \(error)")
        }
    }
    
    func clearRoutes() {
        guard let mapView = mapView else { return }
        
        // Remove all route layers and sources
        for layerId in routeLayerIds {
            do {
                try mapView.mapboxMap.style.removeLayer(withId: layerId)
            } catch {
                print("Error removing layer \(layerId): \(error)")
            }
        }
        
        for sourceId in routeShapeSourceIds {
            do {
                try mapView.mapboxMap.style.removeSource(withId: sourceId)
            } catch {
                print("Error removing source \(sourceId): \(error)")
            }
        }
        
        routeLayerIds.removeAll()
        routeShapeSourceIds.removeAll()
    }
    
    func highlightRoute(with id: String) {
        guard let mapView = mapView else { return }
        
        // Update line width for all routes to highlight the selected one
        for layerId in routeLayerIds {
            do {
                let lineWidth: Double
                if layerId == "route-layer-\(id)" {
                    lineWidth = 6.0
                } else {
                    lineWidth = 3.0
                }
                
                try mapView.mapboxMap.style.setLayerProperty(
                    for: layerId,
                    property: "line-width",
                    value: lineWidth
                )
            } catch {
                print("Error updating route layer: \(error)")
            }
        }
    }
    
    // MARK: - Weather Integration Interface
    
    /// Registers a new weather overlay layer with the map
    /// - Parameters:
    ///   - type: Type of weather overlay (e.g., "temperature", "precipitation")
    ///   - data: GeoJSON data for the overlay
    ///   - options: Display options including paint properties
    /// - Returns: Layer ID for the registered overlay
    func registerWeatherOverlay(type: String, data: [String: Any], options: [String: Any]) -> String? {
        guard let mapView = mapView else { return nil }
        
        let layerId = "weather-\(type)-layer"
        let sourceId = "weather-\(type)"
        
        do {
            // Update existing source with new data
            if let geoJsonData = try? JSONSerialization.data(withJSONObject: data),
               let geoJson = try? mapView.mapboxMap.style.makeGeoJSONFeatureCollection(from: geoJsonData) {
                try mapView.mapboxMap.style.updateGeoJSONSource(withId: sourceId, geoJSON: geoJson)
            }
            
            // Check if the layer already exists
            if !weatherOverlayLayerIds.contains(layerId) {
                // Create appropriate layer based on type
                switch type {
                case "temperature":
                    var fillLayer = FillLayer(id: layerId)
                    fillLayer.source = sourceId
                    
                    // Set up data-driven styling for temperature
                    let stops: [Double: UIColor] = [
                        -20: UIColor(red: 0, green: 0.13, blue: 1, alpha: 1),    // Very cold (deep blue)
                        0: UIColor(red: 0, green: 0.67, blue: 1, alpha: 1),       // Freezing (light blue)
                        32: UIColor.white,                                        // Freezing point (white)
                        50: UIColor.yellow,                                       // Cool (yellow)
                        70: UIColor(red: 1, green: 0.47, blue: 0, alpha: 1),      // Warm (orange)
                        90: UIColor.red,                                          // Hot (red)
                        110: UIColor(red: 0.6, green: 0, blue: 0, alpha: 1)       // Very hot (dark red)
                    ]
                    
                    var stopsExpression: [Expression] = []
                    for (temp, color) in stops {
                        stopsExpression.append(.number(temp))
                        stopsExpression.append(.color(color))
                    }
                    
                    fillLayer.fillColor = .expression(
                        Expression.interpolate(
                            .linear,
                            .number(.get("temperature")),
                            stopsExpression
                        )
                    )
                    
                    // Set opacity
                    if let opacity = options["opacity"] as? Double {
                        fillLayer.fillOpacity = .constant(.number(opacity))
                    } else {
                        fillLayer.fillOpacity = .constant(.number(0.6))
                    }
                    
                    try mapView.mapboxMap.style.addLayer(fillLayer)
                    weatherOverlayLayerIds.append(layerId)
                    
                case "precipitation":
                    var circleLayer = CircleLayer(id: layerId)
                    circleLayer.source = sourceId
                    
                    // Set up data-driven styling for precipitation intensity
                    circleLayer.circleRadius = .expression(
                        Expression.interpolate(
                            .linear,
                            .number(.get("intensity")),
                            .number(0), .number(3),
                            .number(1), .number(15)
                        )
                    )
                    
                    circleLayer.circleColor = .expression(
                        Expression.interpolate(
                            .linear,
                            .number(.get("intensity")),
                            .number(0), .color(UIColor(red: 0, green: 1, blue: 1, alpha: 0.5)),
                            .number(0.5), .color(UIColor(red: 0, green: 0, blue: 1, alpha: 0.5)),
                            .number(1), .color(UIColor(red: 0.5, green: 0, blue: 0.5, alpha: 0.5))
                        )
                    )
                    
                    // Set opacity
                    if let opacity = options["opacity"] as? Double {
                        circleLayer.circleOpacity = .constant(.number(opacity))
                    } else {
                        circleLayer.circleOpacity = .constant(.number(0.7))
                    }
                    
                    try mapView.mapboxMap.style.addLayer(circleLayer)
                    weatherOverlayLayerIds.append(layerId)
                    
                default:
                    // Generic fill layer for other types
                    var fillLayer = FillLayer(id: layerId)
                    fillLayer.source = sourceId
                    
                    // Set fill color from options or default
                    if let colorHex = options["color"] as? String, let color = UIColor(hexString: colorHex) {
                        fillLayer.fillColor = .constant(.color(color))
                    } else {
                        fillLayer.fillColor = .constant(.color(.green))
                    }
                    
                    // Set opacity
                    if let opacity = options["opacity"] as? Double {
                        fillLayer.fillOpacity = .constant(.number(opacity))
                    } else {
                        fillLayer.fillOpacity = .constant(.number(0.5))
                    }
                    
                    try mapView.mapboxMap.style.addLayer(fillLayer)
                    weatherOverlayLayerIds.append(layerId)
                }
            }
            
            return layerId
            
        } catch {
            print("Error adding weather overlay: \(error)")
            return nil
        }
    }
    
    /// Sets visibility of weather overlay layers
    /// - Parameter visible: Whether the overlay should be visible
    func setWeatherOverlaysVisible(_ visible: Bool) {
        guard let mapView = mapView else { return }
        
        let visibility = visible ? "visible" : "none"
        
        for layerId in weatherOverlayLayerIds {
            do {
                try mapView.mapboxMap.style.setLayerProperty(
                    for: layerId,
                    property: "visibility",
                    value: visibility
                )
            } catch {
                print("Error setting layer visibility: \(error)")
            }
        }
    }
    
    /// Sets opacity of a specific layer
    /// - Parameters:
    ///   - layerId: ID of the layer to update
    ///   - opacity: Opacity value between 0 and 1
    func setLayerOpacity(layerId: String, opacity: Double) {
        guard let mapView = mapView else { return }
        
        do {
            // Determine property name based on layer type
            if let layer = try? mapView.mapboxMap.style.layer(withId: layerId) {
                var propertyName = "opacity"
                
                switch layer.type {
                case "fill":
                    propertyName = "fill-opacity"
                case "line":
                    propertyName = "line-opacity"
                case "circle":
                    propertyName = "circle-opacity"
                case "symbol":
                    propertyName = "icon-opacity"
                case "raster":
                    propertyName = "raster-opacity"
                default:
                    break
                }
                
                try mapView.mapboxMap.style.setLayerProperty(
                    for: layerId,
                    property: propertyName,
                    value: opacity
                )
            }
        } catch {
            print("Error setting layer opacity: \(error)")
        }
    }
    
    /// Gets the current map viewport
    /// - Returns: Dictionary with viewport information
    func getCurrentViewport() -> [String: Any] {
        guard let mapView = mapView else { return [:] }
        
        let camera = mapView.mapboxMap.cameraState
        let bounds = mapView.mapboxMap.cameraBounds
        
        return [
            "center": [camera.center.longitude, camera.center.latitude],
            "zoom": camera.zoom,
            "bearing": camera.bearing,
            "pitch": camera.pitch,
            "bounds": [
                [bounds.southwest.longitude, bounds.southwest.latitude],
                [bounds.northeast.longitude, bounds.northeast.latitude]
            ]
        ]
    }
    
    /// Adds a weather alert marker to the map
    /// - Parameters:
    ///   - alertId: Unique identifier for the alert
    ///   - position: Coordinates for the alert
    ///   - properties: Alert properties including type, message, severity
    /// - Returns: Boolean indicating success
    func addWeatherAlert(alertId: String, position: CLLocationCoordinate2D, properties: [String: Any]) -> Bool {
        guard let pointAnnotationManager = pointAnnotationManager else { return false }
        
        // Create point annotation
        var pointAnnotation = PointAnnotation(id: alertId, coordinate: position)
        
        // Set image name based on severity
        let severity = properties["severity"] as? String ?? "warning"
        let imageName: String
        
        switch severity.lowercased() {
        case "severe", "extreme":
            imageName = "alert-severe"
        case "moderate":
            imageName = "alert-moderate"
        default:
            imageName = "alert-warning"
        }
        
        // Set annotation properties
        pointAnnotation.image = .named(imageName)
        
        // Store all properties
        for (key, value) in properties {
            if let stringValue = value as? String {
                pointAnnotation.userInfo[key] = stringValue
            }
        }
        
        // Add annotation to map
        pointAnnotationManager.annotations.append(pointAnnotation)
        
        // Store reference
        weatherAlertAnnotations[alertId] = pointAnnotation
        
        return true
    }
    
    /// Removes a weather alert from the map
    /// - Parameter alertId: ID of the alert to remove
    func removeWeatherAlert(alertId: String) {
        guard let pointAnnotationManager = pointAnnotationManager,
              let annotation = weatherAlertAnnotations[alertId] else { return }
        
        // Find the index of the annotation to remove
        if let index = pointAnnotationManager.annotations.firstIndex(where: { $0.id == annotation.id }) {
            pointAnnotationManager.annotations.remove(at: index)
            weatherAlertAnnotations.removeValue(forKey: alertId)
        }
    }
    
    /// Toggles traffic layer visibility
    /// - Parameter visible: Whether traffic should be visible
    func setTrafficVisible(_ visible: Bool) {
        guard let mapView = mapView else { return }
        
        let trafficLayerId = "mapbox-traffic"
        
        do {
            let styleURL = mapView.mapboxMap.styleURI.rawValue
            
            if visible {
                // Only add if not already present
                if (try? mapView.mapboxMap.style.layer(withId: trafficLayerId)) == nil {
                    // Add traffic layer if map style supports it
                    if styleURL.contains("streets") || styleURL.contains("navigation") {
                        var trafficLayer = LineLayer(id: trafficLayerId)
                        trafficLayer.source = "mapbox"
                        trafficLayer.sourceLayer = "traffic"
                        
                        // Color based on congestion
                        trafficLayer.lineColor = .expression(
                            Expression.match(
                                .string(.get("congestion")),
                                .color(.green),
                                .case(.string("low"), .color(.green)),
                                .case(.string("moderate"), .color(.yellow)),
                                .case(.string("heavy"), .color(.orange)),
                                .case(.string("severe"), .color(.red))
                            )
                        )
                        
                        trafficLayer.lineWidth = .constant(.number(2.0))
                        
                        try mapView.mapboxMap.style.addLayer(trafficLayer)
                    }
                }
            } else {
                // Remove if present
                if (try? mapView.mapboxMap.style.layer(withId: trafficLayerId)) != nil {
                    try mapView.mapboxMap.style.removeLayer(withId: trafficLayerId)
                }
            }
        } catch {
            print("Error toggling traffic layer: \(error)")
        }
    }
}

// MARK: - Utility Extensions

extension UIColor {
    convenience init?(hexString: String) {
        let r, g, b, a: CGFloat
        
        let start = hexString.hasPrefix("#") ? hexString.index(hexString.startIndex, offsetBy: 1) : hexString.startIndex
        var hexColor = String(hexString[start...])
        
        if hexColor.count == 6 {
            hexColor.append("ff")
        }
        
        if hexColor.count == 8 {
            let scanner = Scanner(string: hexColor)
            var hexNumber: UInt64 = 0
            
            if scanner.scanHexInt64(&hexNumber) {
                r = CGFloat((hexNumber & 0xff000000) >> 24) / 255
                g = CGFloat((hexNumber & 0x00ff0000) >> 16) / 255
                b = CGFloat((hexNumber & 0x0000ff00) >> 8) / 255
                a = CGFloat(hexNumber & 0x000000ff) / 255
                
                self.init(red: r, green: g, blue: b, alpha: a)
                return
            }
        }
        
        return nil
    }
    
    var hexString: String {
        let components = self.cgColor.components
        let r = components?[0] ?? 0
        let g = components?[1] ?? 0
        let b = components?[2] ?? 0
        
        return String(format: "#%02lX%02lX%02lX",
                      lroundf(Float(r * 255)),
                      lroundf(Float(g * 255)),
                      lroundf(Float(b * 255)))
    }
}
