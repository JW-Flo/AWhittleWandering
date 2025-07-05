import Foundation
import Network

public class NetworkManager {
    public static let shared = NetworkManager()
    
    private let monitor: NWPathMonitor
    private let queue = DispatchQueue(label: "NetworkMonitor")
    
    @Published public private(set) var isConnected = true
    @Published public private(set) var connectionType: NWInterface.InterfaceType?
    
    private init() {
        monitor = NWPathMonitor()
        setupMonitoring()
    }
    
    private func setupMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
                self.isConnected = path.status == .satisfied
                self.connectionType = path.availableInterfaces.first?.type
                
                if self.isConnected {
                    self.handleReconnection()
                } else {
                    self.handleDisconnection()
                }
            }
        }
        
        monitor.start(queue: queue)
    }
    
    // MARK: - API Endpoints
    
    public func fetchVehicleStatus() async throws -> VehicleData {
        return try await performRequest(endpoint: "/api/vehicle-status")
    }
    
    public func fetchTripProgress() async throws -> TripData {
        return try await performRequest(endpoint: "/api/trip-progress")
    }
    
    public func fetchWeatherForecast() async throws -> WeatherData {
        return try await performRequest(endpoint: "/api/weather-forecast")
    }
    
    public func fetchChargingStations() async throws -> [ChargingStation] {
        return try await performRequest(endpoint: "/api/charging-stations")
    }
    
    public func fetchOptimizedRoute() async throws -> DisplayRoute {
        return try await performRequest(endpoint: "/api/route/optimize")
    }
    
    public func fetchPointsOfInterest() async throws -> [PointOfInterest] {
        return try await performRequest(endpoint: "/api/points-of-interest")
    }
    
    // MARK: - Generic Request Handler
    
    private func performRequest<T: Decodable>(endpoint: String) async throws -> T {
        guard isConnected else {
            throw NetworkError.noConnection
        }
        
        guard let url = URL(string: "https://api.example.com\(endpoint)") else {
            throw NetworkError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw NetworkError.serverError(statusCode: httpResponse.statusCode)
        }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode(T.self, from: data)
        } catch {
            throw NetworkError.decodingError(error)
        }
    }
    
    // MARK: - Offline Handling
    
    private func handleDisconnection() {
        NotificationCenter.default.post(name: .networkStatusChanged, object: nil, userInfo: ["isConnected": false])
    }
    
    private func handleReconnection() {
        NotificationCenter.default.post(name: .networkStatusChanged, object: nil, userInfo: ["isConnected": true])
    }
}

// MARK: - Network Errors

public enum NetworkError: Error {
    case noConnection
    case invalidURL
    case invalidResponse
    case serverError(statusCode: Int)
    case decodingError(Error)
    
    public var localizedDescription: String {
        switch self {
        case .noConnection:
            return "No internet connection available"
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .serverError(let statusCode):
            return "Server error: \(statusCode)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let networkStatusChanged = Notification.Name("networkStatusChanged")
}

// MARK: - Point of Interest Model

public struct PointOfInterest: Codable, Identifiable {
    public let id: String
    public let name: String
    public let description: String
    public let location: LocationCoordinate
    public let category: Category
    public let rating: Double
    
    public enum Category: String, Codable {
        case landmark
        case restaurant
        case hotel
        case attraction
        case scenic
    }
}

// MARK: - Weather Data Model

public struct WeatherData: Codable {
    public let temperature: Double
    public let conditions: String
    public let windSpeed: Double
    public let precipitation: Double
    public let alerts: [WeatherAlert]
}

public struct WeatherAlert: Codable {
    public let severity: Severity
    public let description: String
    public let startTime: Date
    public let endTime: Date
    
    public enum Severity: String, Codable {
        case advisory
        case watch
        case warning
    }
}
