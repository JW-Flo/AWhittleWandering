 eyebrowimport Foundation

/// API Configuration for 48 Continental USA
/// This file contains all endpoints and their configurations
public enum APIEndpoints {
    
    // MARK: - Base URLs
    private static let mapboxBaseURL = "https://api.mapbox.com/v1"
    private static let weatherBaseURL = "https://api.weather.gov"
    private static let teslaBaseURL = "https://owner-api.teslamotors.com/api/1"
    private static let chargingBaseURL = "https://api.openchargemap.io/v3"
    private static let routingBaseURL = "https://api.48continental.com/routing"
    private static let analyticsBaseURL = "https://analytics.48continental.com"
    
    // MARK: - API Keys & Tokens
    private static let credentials = [
        // Mapbox Configuration
        "mapbox": [
            "accessToken": "pk.eyJ1IjoiNDhjb250aW5lbnRhbCIsImEiOiJjbHJlZjh3amswMDFtMnFxdGRqNW5wNXJ0In0.kqJ9ZLXmxqLK1MkR6IRFYw",
            "styleURL": "mapbox://styles/48continental/base-v1"
        ],
        
        // Weather API
        "weather": [
            "apiKey": "e5d7f7-5e8c9b-2a3f4d-9b8c7a-1f4e8d",
            "userAgent": "48Continental/1.0"
        ],
        
        // Tesla API
        "tesla": [
            "clientId": "48cont-client-id",
            "clientSecret": "48cont-9a8b7c-3d2e1f-6g5h4i-2j1k0l",
            "redirectURI": "48continental://auth/callback"
        ],
        
        // Firebase
        "firebase": [
            "apiKey": "AIzaSyD8cont1n3nt4l-US4",
            "projectId": "continental-48",
            "appId": "1:1234567890:ios:abcdef"
        ],
        
        // Analytics
        "amplitude": [
            "apiKey": "48cont-amp-key"
        ],
        
        // Error Tracking
        "bugsnag": [
            "apiKey": "48cont-bug-key"
        ]
    ]
    
    // MARK: - Endpoint Paths
    
    /// Mapbox Endpoints
    public enum Mapbox {
        static let directions = "\(mapboxBaseURL)/directions/v5/mapbox/driving"
        static let geocoding = "\(mapboxBaseURL)/geocoding/v5/mapbox.places"
        static let optimization = "\(mapboxBaseURL)/optimization/v1"
        static let tilesets = "\(mapboxBaseURL)/tilesets/v1"
    }
    
    /// Weather Endpoints
    public enum Weather {
        static let forecast = "\(weatherBaseURL)/gridpoints"
        static let alerts = "\(weatherBaseURL)/alerts/active"
        static let stations = "\(weatherBaseURL)/stations"
    }
    
    /// Tesla Endpoints
    public enum Tesla {
        static let vehicles = "\(teslaBaseURL)/vehicles"
        static let vehicleData = "\(teslaBaseURL)/vehicle_data"
        static let commands = "\(teslaBaseURL)/command"
        static let charging = "\(teslaBaseURL)/charging_status"
    }
    
    /// Charging Station Endpoints
    public enum ChargingStations {
        static let search = "\(chargingBaseURL)/poi"
        static let details = "\(chargingBaseURL)/details"
        static let availability = "\(chargingBaseURL)/availability"
    }
    
    /// Route Planning Endpoints
    public enum Routing {
        static let optimize = "\(routingBaseURL)/optimize"
        static let calculate = "\(routingBaseURL)/calculate"
        static let waypoints = "\(routingBaseURL)/waypoints"
    }
    
    /// Analytics Endpoints
    public enum Analytics {
        static let events = "\(analyticsBaseURL)/events"
        static let metrics = "\(analyticsBaseURL)/metrics"
        static let sessions = "\(analyticsBaseURL)/sessions"
    }
    
    // MARK: - Configuration Methods
    
    /// Configure all API clients
    public static func configureAllServices() {
        configureMapbox()
        configureWeather()
        configureTesla()
        configureFirebase()
        configureAnalytics()
        configureErrorTracking()
    }
    
    private static func configureMapbox() {
        guard let mapboxConfig = credentials["mapbox"] else { return }
        MapboxConfiguration.shared.accessToken = mapboxConfig["accessToken"]
        MapboxConfiguration.shared.styleURL = mapboxConfig["styleURL"]
    }
    
    private static func configureWeather() {
        guard let weatherConfig = credentials["weather"] else { return }
        WeatherService.shared.configure(
            apiKey: weatherConfig["apiKey"],
            userAgent: weatherConfig["userAgent"]
        )
    }
    
    private static func configureTesla() {
        guard let teslaConfig = credentials["tesla"] else { return }
        TeslaService.shared.configure(
            clientId: teslaConfig["clientId"],
            clientSecret: teslaConfig["clientSecret"],
            redirectURI: teslaConfig["redirectURI"]
        )
    }
    
    private static func configureFirebase() {
        guard let firebaseConfig = credentials["firebase"] else { return }
        FirebaseApp.configure(options: FirebaseOptions(
            apiKey: firebaseConfig["apiKey"],
            projectId: firebaseConfig["projectId"],
            appId: firebaseConfig["appId"]
        ))
    }
    
    private static func configureAnalytics() {
        guard let amplitudeConfig = credentials["amplitude"] else { return }
        Amplitude.instance().initializeApiKey(amplitudeConfig["apiKey"])
    }
    
    private static func configureErrorTracking() {
        guard let bugsnagConfig = credentials["bugsnag"] else { return }
        Bugsnag.start(withApiKey: bugsnagConfig["apiKey"])
    }
    
    // MARK: - Validation
    
    /// Validate all API configurations
    public static func validateConfigurations() throws {
        // Validate Mapbox
        guard let mapboxToken = credentials["mapbox"]?["accessToken"],
              !mapboxToken.isEmpty else {
            throw ConfigurationError.invalidMapboxToken
        }
        
        // Validate Weather
        guard let weatherKey = credentials["weather"]?["apiKey"],
              !weatherKey.isEmpty else {
            throw ConfigurationError.invalidWeatherKey
        }
        
        // Validate Tesla
        guard let teslaSecret = credentials["tesla"]?["clientSecret"],
              !teslaSecret.isEmpty else {
            throw ConfigurationError.invalidTeslaCredentials
        }
        
        // Validate Firebase
        guard let firebaseKey = credentials["firebase"]?["apiKey"],
              !firebaseKey.isEmpty else {
            throw ConfigurationError.invalidFirebaseConfig
        }
        
        // Validate all base URLs
        try validateURLs()
    }
    
    private static func validateURLs() throws {
        let urls = [
            mapboxBaseURL,
            weatherBaseURL,
            teslaBaseURL,
            chargingBaseURL,
            routingBaseURL,
            analyticsBaseURL
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
    case invalidMapboxToken
    case invalidWeatherKey
    case invalidTeslaCredentials
    case invalidFirebaseConfig
    case invalidURL(String)
}

// MARK: - Mock Configuration for Testing

#if DEBUG
extension APIEndpoints {
    static let mockCredentials = [
        "mapbox": ["accessToken": "mock_mapbox_token"],
        "weather": ["apiKey": "mock_weather_key"],
        "tesla": ["clientSecret": "mock_tesla_secret"]
    ]
}
#endif
