import Foundation
import CoreLocation
import SwiftUI
import Models
import Combine

/// AppState serves as the central state container for the 48 Continental USA application
public final class AppState: NSObject, ObservableObject, CLLocationManagerDelegate {
  // MARK: - Location Services
  
  private let locationManager = CLLocationManager()
  @Published public var currentLocation: CLLocationCoordinate2D?
  @Published public var lastVisit: CLVisit?
  
  // MARK: - Map Settings
  
  /// MapBox access token - loaded from Info.plist or environment
  @Published public var mapboxToken: String = {
    // First try to load from environment
    if let token = ProcessInfo.processInfo.environment["MAPBOX_ACCESS_TOKEN"] {
      return token
    }
    
    // Then try from Info.plist
    if let token = Bundle.main.infoDictionary?["MGLMapboxAccessToken"] as? String {
      return token
    }
    
    // Default development token (replace with your actual token)
    return "pk.your_mapbox_token_here"
  }()
  
  /// Whether to show weather overlays on the map
  @Published public var showWeatherOverlays: Bool = true
  
  /// Whether to show traffic on the map
  @Published public var showTraffic: Bool = false
  
  /// Current map style
  @Published public var mapStyle: MapStyle = .dark
  
  /// Available map styles
  public enum MapStyle: String, CaseIterable, Identifiable {
    case standard = "Standard"
    case satellite = "Satellite" 
    case dark = "Dark"
    case light = "Light"
    
    public var id: String { self.rawValue }
    
    /// MapBox style URI for the selected style
    public var styleURI: String {
      switch self {
      case .standard: return "mapbox://styles/mapbox/streets-v12"
      case .satellite: return "mapbox://styles/mapbox/satellite-streets-v12"
      case .dark: return "mapbox://styles/mapbox/dark-v11"
      case .light: return "mapbox://styles/mapbox/light-v11"
      }
    }
  }
  
  // MARK: - Route Data
  
  /// Currently selected route
  @Published public var selectedRoute: DisplayRoute?
  
  /// Available routes
  @Published public var routes: [DisplayRoute] = []
  
  /// Vehicle data
  @Published public var vehicleData: VehicleData?
  
  /// Current weather data
  @Published public var weatherData: WeatherData?
  
  // MARK: - Weather Overlay Settings
  
  /// Weather overlay types
  @Published public var enabledWeatherOverlays: Set<WeatherOverlayType> = [.temperature, .radar]
  
  /// Weather overlay opacity (0-1)
  @Published public var weatherOverlayOpacity: Double = 0.7
  
  /// Weather overlay types
  public enum WeatherOverlayType: String, CaseIterable, Identifiable {
    case temperature = "Temperature"
    case precipitation = "Precipitation"
    case radar = "Radar"
    case alerts = "Alerts"
    
    public var id: String { self.rawValue }
  }
  
  // MARK: - Cancellables
  
  private var cancellables = Set<AnyCancellable>()
  
  // MARK: - Initialization
  
  public override init() {
    super.init()
    
    // Set up location manager
    locationManager.delegate = self
    locationManager.desiredAccuracy = kCLLocationAccuracyBest
    locationManager.requestAlwaysAuthorization()
    locationManager.startMonitoringVisits()
    locationManager.startUpdatingLocation()
    
    // Load initial data
    loadSampleData()
    
    // Start monitoring network for live data
    startNetworkMonitoring()
  }
  
  // MARK: - Location Manager Delegate
  
  public func locationManager(_ manager: CLLocationManager, didVisit visit: CLVisit) {
    lastVisit = visit
    print("Visit at \(visit.coordinate) - Arrival: \(visit.arrivalDate), Departure: \(visit.departureDate)")
  }
  
  public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    if let location = locations.last {
      currentLocation = location.coordinate
    }
  }
  
  // MARK: - Data Loading
  
  private func loadSampleData() {
    // Load sample routes
    routes = [DisplayRoute.preview]
    selectedRoute = routes.first
    
    // Create sample vehicle data
    vehicleData = VehicleData(
      batteryLevel: 72,
      range: 219,
      speed: 65,
      power: 14,
      latitude: 39.8283,
      longitude: -98.5795,
      heading: 90,
      lastUpdate: Date()
    )
    
    // Create sample weather data
    weatherData = WeatherData(
      temperature: 72,
      condition: "Partly Cloudy",
      humidity: 45,
      windSpeed: 8,
      icon: "cloud.sun.fill"
    )
  }
  
  private func startNetworkMonitoring() {
    // Set up network monitoring for live data updates
    // This would connect to a real API in production
    Timer.publish(every: 30, on: .main, in: .common)
      .autoconnect()
      .sink { [weak self] _ in
        self?.updateVehicleData()
      }
      .store(in: &cancellables)
    
    Timer.publish(every: 300, on: .main, in: .common)
      .autoconnect()
      .sink { [weak self] _ in
        self?.updateWeatherData()
      }
      .store(in: &cancellables)
  }
  
  private func updateVehicleData() {
    // In a real app, this would fetch data from an API
    // For now, we'll just update with simulated data
    guard var data = vehicleData else { return }
    
    // Simulate vehicle movement
    data.latitude += Double.random(in: -0.01...0.01)
    data.longitude += Double.random(in: -0.01...0.01)
    
    // Simulate battery depletion
    data.batteryLevel = max(data.batteryLevel - Double.random(in: 0...0.5), 0)
    data.range = max(data.range - Double.random(in: 0...1), 0)
    
    // Update speed
    data.speed = Double.random(in: 55...75)
    
    // Update power
    data.power = Double.random(in: 10...20)
    
    // Update timestamp
    data.lastUpdate = Date()
    
    // Publish updates
    vehicleData = data
  }
  
  private func updateWeatherData() {
    // In a real app, this would fetch data from a weather API
    // For now, we'll just update with simulated data
    guard var data = weatherData else { return }
    
    // Update temperature
    data.temperature += Double.random(in: -2...2)
    
    // Update wind speed
    data.windSpeed += Double.random(in: -1...1)
    data.windSpeed = max(data.windSpeed, 0)
    
    // Update conditions randomly
    let conditions = ["Clear", "Partly Cloudy", "Cloudy", "Rain", "Thunderstorm"]
    let icons = ["sun.max.fill", "cloud.sun.fill", "cloud.fill", "cloud.rain.fill", "cloud.bolt.fill"]
    
    if Int.random(in: 0...10) > 8 {
      let index = Int.random(in: 0..<conditions.count)
      data.condition = conditions[index]
      data.icon = icons[index]
    }
    
    // Publish updates
    weatherData = data
  }
}

// MARK: - Data Models

extension AppState {
  /// Vehicle data model
  public struct VehicleData {
    public var batteryLevel: Double
    public var range: Double
    public var speed: Double
    public var power: Double
    public var latitude: Double
    public var longitude: Double
    public var heading: Double
    public var lastUpdate: Date
    
    public var coordinate: CLLocationCoordinate2D {
      CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
  }
  
  /// Weather data model
  public struct WeatherData {
    public var temperature: Double
    public var condition: String
    public var humidity: Double
    public var windSpeed: Double
    public var icon: String
  }
}
