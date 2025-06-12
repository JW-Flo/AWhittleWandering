// Sources/AllInOne.swift

import Foundation
import Combine
import MapboxMaps
import KeychainAccess

// MARK: - Models
struct Trip: Identifiable {
    let id: String
    var states: [String]
    var startDate: Date
    var activities: [ActivityType]
    var route: [RoutePoint]
}

struct ChargingStation: Identifiable {
    let id: String
    let name: String
    let location: CLLocationCoordinate2D
    let type: ChargerType
}

struct WeatherForecast {
    let temperature: Double
    let conditions: String
    let timestamp: Date
}

enum ActivityType: String, CaseIterable {
    case hiking, cityTours, foodie, nationalParks, photography
}

enum ChargerType: String {
    case supercharger, destination, publicEV
}

struct RoutePoint {
    let coordinate: CLLocationCoordinate2D
    let name: String
    let distance: Double
}

// MARK: - Networking
enum RealAPIEndpoints {
    // Base URLs
    private static let tessieBaseURL = "https://api.tessie.com/v1"
    private static let abrpBaseURL = "https://api.iternio.com/1"
    private static let nwsBaseURL = "https://api.weather.gov"
    private static let mapboxBaseURL = "https://api.mapbox.com/v1"
    private static let cloudflareBaseURL = "https://route-tracker.48continental.workers.dev"
    
    // Credentials
    private static let credentials = [
        "tessie": [
            "apiKey": "tsk_live_48continental_key",
            "fleetId": "48cont_fleet_id",
            "wsEndpoint": "wss://streaming.tessie.com/v1/fleet"
        ],
        "abrp": [
            "clientId": "48cont_abrp_client",
            "clientSecret": "48cont_abrp_secret",
            "apiKey": "48cont_abrp_key"
        ],
        "mapbox": [
            "accessToken": "pk.48continental.mapbox",
            "styleURL": "mapbox://styles/48continental/base-v1"
        ],
        "cloudflare": [
            "workerToken": "48cont_worker_token",
            "accountId": "48cont_cf_account"
        ]
    ]
    
    // MARK: - API Endpoints
    enum Tessie {
        static let vehicles = tessieBaseURL + "/vehicles"
        static let telemetry = tessieBaseURL + "/telemetry"
        static let commands = tessieBaseURL + "/commands"
        static let fleetStream = credentials["tessie"]?["wsEndpoint"] ?? ""
        
        static var headers: [String: String] {
            ["Authorization": "Bearer $credentials["tessie"]?["apiKey"] ?? "")"]
        }
    }
    
    enum ABRP {
        static let planning = abrpBaseURL + "/route/plan"
        static let telemetry = abrpBaseURL + "/telemetry"
        static let oauth = abrpBaseURL + "/oauth/token"
        
        static var headers: [String: String] {
            [
                "X-Api-Key": credentials["abrp"]?["apiKey"] ?? "",
                "Authorization": "Bearer $credentials["abrp"]?["clientSecret"] ?? "")"
            ]
        }
    }
    
    enum Weather {
        static let stations = nwsBaseURL + "/stations"
        static let points = nwsBaseURL + "/points"
        static let gridpoints = nwsBaseURL + "/gridpoints"
        static let alerts = nwsBaseURL + "/alerts/active"
        
        static var headers: [String: String] {
            ["User-Agent": "48Continental/1.0"]
        }
    }
    
    enum CloudflareWorker {
        static let routeTracking = cloudflareBaseURL + "/route"
        static let tripData = cloudflareBaseURL + "/trip"
        static let sync = cloudflareBaseURL + "/sync"
        
        static var headers: [String: String] {
            ["Authorization": "Bearer $credentials["cloudflare"]?["workerToken"] ?? "")"]
        }
    }
    
    // MARK: - Configuration
    static func configureAllServices() {
        configureTessie()
        configureABRP()
        configureWeather()
        configureCloudflare()
    }
    
    private static func configureTessie() {
        guard let tessieConfig = credentials["tessie"] else { return }
        TessieService.shared.configure(
            apiKey: tessieConfig["apiKey"]!,
            fleetId: tessieConfig["fleetId"]!,
            wsEndpoint: tessieConfig["wsEndpoint"]!
        )
    }
    
    private static func configureABRP() {
        guard let abrpConfig = credentials["abrp"] else { return }
        ABRPService.shared.configure(
            clientId: abrpConfig["clientId"]!,
            clientSecret: abrpConfig["clientSecret"]!,
            apiKey: abrpConfig["apiKey"]!
        )
    }
    
    private static func configureWeather() {
        WeatherService.shared.configure(userAgent: "48Continental/1.0")
    }
    
    private static func configureCloudflare() {
        guard let cfConfig = credentials["cloudflare"] else { return }
        CloudflareService.shared.configure(
            workerToken: cfConfig["workerToken"]!,
            accountId: cfConfig["accountId"]!
        )
    }
    
    // MARK: - Validation
    static func validateConfigurations() throws {
        guard !credentials["tessie"]?["apiKey"].isNilOrEmpty else {
            throw ConfigurationError.invalidTessieKey
        }
        guard !credentials["abrp"]?["apiKey"].isNilOrEmpty else {
            throw ConfigurationError.invalidABRPKey
        }
        guard !credentials["cloudflare"]?["workerToken"].isNilOrEmpty else {
            throw ConfigurationError.invalidCloudflareToken
        }
        try validateURLs()