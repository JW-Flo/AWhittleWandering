import Foundation

/// Real API Configuration for 48 Continental USA
/// Matches the actual APIs used by the web application
public enum RealAPIEndpoints {
    
    // MARK: - Base URLs
    
    private static let tessieBaseURL = "https://api.tessie.com/v1"
    private static let abrpBaseURL = "https://api.iternio.com/1"
    private static let nwsBaseURL = "https://api.weather.gov"
    private static let mapboxBaseURL = "https://api.mapbox.com/v1"
    private static let cloudflareBaseURL = "https://route-tracker.48continental.workers.dev"
    
    // MARK: - API Keys & Credentials
    
    private static let credentials = [
        // Tessie API (Tesla Integration)
        "tessie": [
            "apiKey": "tsk_live_48continental_key",
            "fleetId": "48cont_fleet_id",
            "wsEndpoint": "wss://streaming.tessie.com/v1/fleet"
        ],
        
        // ABRP (Route Planning)
        "abrp": [
            "clientId": "48cont_abrp_client",
            "clientSecret": "48cont_abrp_secret",
            "apiKey": "48cont_abrp_key"
        ],
        
        // Mapbox
        "mapbox": [
            "accessToken": "pk.48continental.mapbox",
            "styleURL": "mapbox://styles/48continental/base-v1"
        ],
        
        // Cloudflare
        "cloudflare": [
            "workerToken": "48cont_worker_token",
            "accountId": "48cont_cf_account"
        ]
    ]
    
    // MARK: - Tessie API Endpoints
    
    public enum Tessie {
        static let vehicles = "\(tessieBaseURL)/vehicles"
        static let telemetry = "\(tessieBaseURL)/telemetry"
        static let commands = "\(tessieBaseURL)/commands"
        static let fleetStream = "\(credentials["tessie"]?["wsEndpoint"] ?? "")"
        
        static var headers: [String: String] {
            ["Authorization": "Bearer \(credentials["tessie"]?["apiKey"] ?? "")"]
        }
    }
    
    // MARK: - ABRP Endpoints
    
    public enum ABRP {
        static let planning = "\(abrpBaseURL)/route/plan"
        static let telemetry = "\(abrpBaseURL)/telemetry"
        static let oauth = "\(abrpBaseURL)/oauth/token"
        
        static var headers: [String: String] {
            [
                "X-Api-Key": credentials["abrp"]?["apiKey"] ?? "",
                "Authorization": "Bearer \(credentials["abrp"]?["clientSecret"] ?? "")"
            ]
        }
    }
    
    // MARK: - NWS Weather Endpoints
    
    public enum Weather {
        static let stations = "\(nwsBaseURL)/stations"
        static let points = "\(nwsBaseURL)/points"
        static let gridpoints = "\(nwsBaseURL)/gridpoints"
        static let alerts = "\(nwsBaseURL)/alerts/active"
        
        static var headers: [String: String] {
            ["User-Agent": "48Continental/1.0"]
        }
    }
    
    // MARK: - Cloudflare Worker Endpoints
    
    public enum CloudflareWorker {
        static let routeTracking = "\(cloudflareBaseURL)/route"
        static let tripData = "\(cloudflareBaseURL)/trip"
        static let sync = "\(cloudflareBaseURL)/sync"
        
        static var headers: [String: String] {
            ["Authorization": "Bearer \(credentials["cloudflare"]?["workerToken"] ?? "")"]
        }
    }
    
    // MARK: - Configuration Methods
    
    /// Configure all API clients
    public static func configureAllServices() {
        configureTessie()
        configureABRP()
        configureWeather()
        configureCloudflare()
    }
    
    private static func configureTessie() {
        guard let tessieConfig = credentials["tessie"] else { return }
        TessieService.shared.configure(
            apiKey: tessieConfig["apiKey"],
            fleetId: tessieConfig["fleetId"],
            wsEndpoint: tessieConfig["wsEndpoint"]
        )
    }
    
    private static func configureABRP() {
        guard let abrpConfig = credentials["abrp"] else { return }
        ABRPService.shared.configure(
            clientId: abrpConfig["clientId"],
            clientSecret: abrpConfig["clientSecret"],
            apiKey: abrpConfig["apiKey"]
        )
    }
    
    private static func configureWeather() {
        WeatherService.shared.configure(userAgent: "48Continental/1.0")
    }
    
    private static func configureCloudflare() {
        guard let cfConfig = credentials["cloudflare"] else { return }
        CloudflareService.shared.configure(
            workerToken: cfConfig["workerToken"],
            accountId: cfConfig["accountId"]
        )
    }
    
    // MARK: - Validation
    
    /// Validate all API configurations
    public static func validateConfigurations() throws {
        // Validate Tessie
        guard let tessieKey = credentials["tessie"]?["apiKey"],
              !tessieKey.isEmpty else {
            throw ConfigurationError.invalidTessieKey
        }
        
        // Validate ABRP
        guard let abrpKey = credentials["abrp"]?["apiKey"],
              !abrpKey.isEmpty else {
            throw ConfigurationError.invalidABRPKey
        }
        
        // Validate Cloudflare
        guard let cfToken = credentials["cloudflare"]?["workerToken"],
              !cfToken.isEmpty else {
            throw ConfigurationError.invalidCloudflareToken
        }
        
        // Validate all base URLs
        try validateURLs()
    }
    
    private static func validateURLs() throws {
        let urls = [
            tessieBaseURL,
            abrpBaseURL,
            nwsBaseURL,
            mapboxBaseURL,
            cloudflareBaseURL
        ]
        
        for url in urls {
            guard URL(string: url) != nil else {
                throw ConfigurationError.invalidURL(url)
            }
        }
    }
}

// MARK: - Supporting Types

public enum ConfigurationError: Error {
    case invalidTessieKey
    case invalidABRPKey
    case invalidCloudflareToken
    case invalidURL(String)
}

// MARK: - Mock Configuration for Testing

#if DEBUG
extension RealAPIEndpoints {
    static let mockCredentials = [
        "tessie": ["apiKey": "mock_tessie_key"],
        "abrp": ["apiKey": "mock_abrp_key"],
        "cloudflare": ["workerToken": "mock_cf_token"]
    ]
}
#endif
