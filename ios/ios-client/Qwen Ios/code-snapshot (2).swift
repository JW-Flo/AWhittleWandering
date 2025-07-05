    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure API keys
        do {
            try RealAPIEndpoints.validateConfigurations()
            RealAPIEndpoints.configureAllServices()
        } catch {
            print("❌ Configuration failed: $error)")
        }
        
        // Initialize Keychain
        do {
            try KeychainManager.shared.saveToken(
                RealAPIEndpoints.credentials["tessie"]?["apiKey"] ?? "",
                forKey: "tessie_api_key"
            )
        } catch {
            print("❌ Keychain error: $error)")
        }
        
        return true
    }
}

// MARK: - Keychain Manager
class KeychainManager {
    static let shared = KeychainManager()
    private let keychain = Keychain(service: "com.48continental.usa")
    
    func saveToken(_ token: String, forKey key: String) throws {
        try keychain.set(token, key: key)
    }
    
    func getToken(forKey key: String) throws -> String? {
        try keychain.get(key)
    }
}

// MARK: - Services
class TessieService {
    static let shared = TessieService()
    private init() {}
    
    func configure(apiKey: String, fleetId: String, wsEndpoint: String) {
        // Store credentials securely
    }
    
    func getVehicleData() async throws -> [String: Any] {
        // Implementation
        return ["status": "connected"]
    }
}

class ABRPService {
    static let shared = ABRPService()
    private init() {}
    
    func configure(clientId: String, clientSecret: String, apiKey: String) {
        // Store credentials
    }
    
    func planRoute(from start: CLLocationCoordinate2D, to end: CLLocationCoordinate2D) async throws -> [RoutePoint] {
        // Implementation
        return [
            RoutePoint(coordinate: start, name: "Start", distance: 0),
            RoutePoint(coordinate: end, name: "End", distance: 100)
        ]
    }
}

class CloudflareService {
    static let shared = CloudflareService()
    private init() {}
    
    func configure(workerToken: String, accountId: String) {
        // Store credentials
    }
}

// MARK: - ViewModels
class TripViewModel: ObservableObject {
    @Published var chargingStations: [ChargingStation] = []
    @Published var currentLocation: CLLocationCoordinate2D?
    @Published var route: [RoutePoint] = []
    @Published var weather: WeatherForecast?
    
    private let tessie = TessieService.shared
    private let abrp = ABRPService.shared
    
    func loadChargingStations(near location: CLLocationCoordinate2D) async {
        // Implementation
        chargingStations = [
            ChargingStation(id: "1", name: "SF Supercharger", location: location, type: .supercharger)
        ]
    }
    
    func planRoute(from start: CLLocationCoordinate2D, to end: CLLocationCoordinate2D) async {
        route = try! await abrp.planRoute(from: start, to: end)
    }
}

// MARK: - Views
import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationView {
            HomeView()
        }
    }
}

struct HomeView: View {
    @State private var showingPlanner = false
    
    var body: some View {
        VStack {
            Text("48 Continental USA")
                .font(.largeTitle)
                .padding()
            
            Button("Plan Trip") {
                showingPlanner = true
            }
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(8)
            
            NavigationLink(isActive: $showingPlanner) {
                TripPlannerView()
            } label: {}
        }
    }
}

struct TripPlannerView: View {
    @State private var selectedStates = Set<String>()
    @State private var startDate = Date()
    @State private var origin = ""
    @State private var destination = ""
    @State private var showingMap = false
    
    var body: some View {
        Form {
            Section("Route") {
                TextField("Origin", text: $origin)
                TextField("Destination", text: $destination)
            }
            
            Section("Travel Dates") {
                DatePicker("Start", selection: $startDate)
            }
            
            Button("Get Directions") {
                showingMap = true
            }
        }
        .navigationTitle("Plan Your Trip")
        .fullScreenCover(isPresented: $showingMap) {
            MapView()
        }
    }
}

struct MapView: View {
    var body: some View {
        MapViewRepresentable()
            .edgesIgnoringSafeArea(.all)
    }
}

struct MapViewRepresentable: UIViewRepresentable {
    func makeUIView(context: Context) -> MapboxView {
        let options = MapInitOptions(styleURI: .hybrid)
        let mapView = MapView(frame: .zero, mapInitOptions: options)
        return mapView
    }
    
    func updateUIView(_ uiView: MapboxView, context: Context) {
        // Update with route/charging stations
    }
}

// MARK: - Location Manager
class LocationManager: NSObject, ObservableObject {
    private let locationManager = CLLocationManager()
    @Published var currentLocation: CLLocationCoordinate2D?
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
    }
}

extension LocationManager: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        currentLocation = location.coordinate
    }
}

// MARK: - Supporting Types
enum ConfigurationError: Error {
    case invalidTessieKey
    case invalidABRPKey
    case invalidCloudflareToken
    case invalidURL(String)
}

extension Dictionary where Key == String, Value == String {
    subscript(safe key: String) -> String? {
        self.first(where: { $0.key == key })?.value
    }
}

extension StringProtocol where Self: RangeReplaceableCollection {
    var isNilOrEmpty: Bool {
        self == nil || isEmpty
    }
}