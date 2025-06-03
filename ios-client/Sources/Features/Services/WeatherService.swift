import Foundation
import Combine
import CoreLocation

public class WeatherService: ObservableObject {
    public static let shared = WeatherService()
    
    @Published public private(set) var currentWeather: WeatherModel?
    @Published public private(set) var weatherAlerts: [WeatherAlert] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var error: Error?
    
    private var cancellables = Set<AnyCancellable>()
    private let cache = NSCache<NSString, CachedWeather>()
    
    private init() {
        setupNotifications()
    }
    
    public func fetchWeather(for location: CLLocationCoordinate2D) {
        // Check cache first
        if let cached = getCachedWeather(for: location) {
            self.currentWeather = cached.weather
            return
        }
        
        isLoading = true
        let urlString = "https://api.weather.gov/points/\(location.latitude),\(location.longitude)/forecast"
        guard let url = URL(string: urlString) else {
            self.error = WeatherError.invalidURL
            isLoading = false
            return
        }
        
        URLSession.shared.dataTaskPublisher(for: url)
            .map(\.data)
            .decode(type: WeatherResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error
                }
            } receiveValue: { [weak self] response in
                let weather = self?.processWeatherResponse(response)
                self?.currentWeather = weather
                if let weather = weather {
                    self?.cacheWeather(weather, for: location)
                }
            }
            .store(in: &cancellables)
    }
    
    public func fetchWeatherAlerts(for location: CLLocationCoordinate2D) {
        let urlString = "https://api.weather.gov/alerts/active"
        guard let url = URL(string: urlString) else { return }
        
        URLSession.shared.dataTaskPublisher(for: url)
            .map(\.data)
            .decode(type: AlertResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink { completion in
                if case .failure(let error) = completion {
                    print("Error fetching alerts: \(error)")
                }
            } receiveValue: { [weak self] response in
                self?.weatherAlerts = response.alerts
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Private Methods
    
    private func processWeatherResponse(_ response: WeatherResponse) -> WeatherModel {
        // Convert API response to our WeatherModel
        WeatherModel(
            temperature: response.properties.temperature,
            condition: response.properties.shortForecast,
            alert: response.properties.hazardStatement
        )
    }
    
    private func setupNotifications() {
        NotificationCenter.default.publisher(for: .networkStatusChanged)
            .sink { [weak self] notification in
                if let isConnected = notification.userInfo?["isConnected"] as? Bool,
                   isConnected {
                    // Refresh weather data when connection is restored
                    self?.refreshWeatherData()
                }
            }
            .store(in: &cancellables)
    }
    
    private func refreshWeatherData() {
        // Implement refresh logic when needed
        guard let lastLocation = UserDefaults.standard.object(forKey: "LastWeatherLocation") as? [String: Double],
              let latitude = lastLocation["latitude"],
              let longitude = lastLocation["longitude"] else {
            return
        }
        
        let location = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        fetchWeather(for: location)
    }
    
    // MARK: - Caching
    
    private func getCachedWeather(for location: CLLocationCoordinate2D) -> CachedWeather? {
        let key = cacheKey(for: location)
        guard let cached = cache.object(forKey: key) else { return nil }
        
        // Check if cache is still valid (30 minutes)
        if Date().timeIntervalSince(cached.timestamp) > 1800 {
            cache.removeObject(forKey: key)
            return nil
        }
        
        return cached
    }
    
    private func cacheWeather(_ weather: WeatherModel, for location: CLLocationCoordinate2D) {
        let key = cacheKey(for: location)
        let cached = CachedWeather(weather: weather, timestamp: Date())
        cache.setObject(cached, forKey: key)
        
        // Save last location for refresh
        let locationDict = [
            "latitude": location.latitude,
            "longitude": location.longitude
        ]
        UserDefaults.standard.set(locationDict, forKey: "LastWeatherLocation")
    }
    
    private func cacheKey(for location: CLLocationCoordinate2D) -> NSString {
        "\(location.latitude),\(location.longitude)" as NSString
    }
}

// MARK: - Supporting Types

private class CachedWeather {
    let weather: WeatherModel
    let timestamp: Date
    
    init(weather: WeatherModel, timestamp: Date) {
        self.weather = weather
        self.timestamp = timestamp
    }
}

private struct WeatherResponse: Codable {
    let properties: Properties
    
    struct Properties: Codable {
        let temperature: Double
        let shortForecast: String
        let hazardStatement: String?
    }
}

private struct AlertResponse: Codable {
    let alerts: [WeatherAlert]
}

public enum WeatherError: Error {
    case invalidURL
    case networkError
    case decodingError
    
    var localizedDescription: String {
        switch self {
        case .invalidURL:
            return "Invalid weather service URL"
        case .networkError:
            return "Failed to connect to weather service"
        case .decodingError:
            return "Failed to process weather data"
        }
    }
}
