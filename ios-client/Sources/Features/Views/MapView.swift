import SwiftUI
import MapboxMaps
import CoreLocation

public struct MapView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var viewModel = MapViewModel()
    
    public var body: some View {
        ZStack {
            // MapBox View
            MapBoxViewRepresentable(
                route: appState.currentRoute,
                chargingStations: appState.nearbyChargingStations,
                isNavigating: viewModel.isNavigating
            )
            
            // Overlay Controls
            VStack {
                // Top Bar with Weather and Battery Info
                topBar
                
                Spacer()
                
                // Bottom Sheet with Route Details
                if viewModel.isShowingRouteDetails {
                    routeDetailsSheet
                }
            }
            
            // Navigation Instructions
            if viewModel.isNavigating {
                navigationInstructionsOverlay
            }
        }
        .edgesIgnoringSafeArea(.all)
    }
    
    // MARK: - Top Bar
    
    private var topBar: some View {
        HStack {
            // Weather Info
            WeatherInfoView(
                temperature: viewModel.currentTemperature,
                condition: viewModel.currentWeatherCondition
            )
            
            Spacer()
            
            // Battery Status
            BatteryStatusView(
                level: appState.currentVehicle?.batteryLevel ?? 0,
                range: appState.currentVehicle?.range ?? 0
            )
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .opacity(0.9)
        )
        .padding()
    }
    
    // MARK: - Route Details Sheet
    
    private var routeDetailsSheet: some View {
        RouteDetailsSheet(
            route: appState.currentRoute,
            isVisible: $viewModel.isShowingRouteDetails
        ) {
            viewModel.startNavigation()
        }
        .transition(.move(edge: .bottom))
    }
    
    // MARK: - Navigation Instructions
    
    private var navigationInstructionsOverlay: some View {
        VStack {
            if let instruction = viewModel.currentInstruction {
                NavigationInstructionView(instruction: instruction)
            }
        }
        .padding()
    }
}

// MARK: - MapBox View Representable

private struct MapBoxViewRepresentable: UIViewRepresentable {
    let route: DisplayRoute?
    let chargingStations: [ChargingStation]
    let isNavigating: Bool
    
    func makeUIView(context: Context) -> MapView {
        let mapView = MapView(frame: .zero)
        mapView.mapboxMap.loadStyleURI(.streets)
        
        // Configure the map
        MapManager.shared.configureMapView(mapView)
        
        return mapView
    }
    
    func updateUIView(_ mapView: MapView, context: Context) {
        if let route = route {
            MapManager.shared.startNavigation(for: route)
        }
    }
}

// MARK: - Weather Info View

private struct WeatherInfoView: View {
    let temperature: Double
    let condition: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: weatherIcon)
                .font(.title2)
            
            VStack(alignment: .leading) {
                Text("\(Int(temperature))°")
                    .font(.headline)
                Text(condition)
                    .font(.caption)
            }
        }
        .foregroundColor(.primary)
    }
    
    private var weatherIcon: String {
        switch condition.lowercased() {
        case let c where c.contains("rain"): return "cloud.rain"
        case let c where c.contains("snow"): return "cloud.snow"
        case let c where c.contains("cloud"): return "cloud"
        case let c where c.contains("sun"): return "sun.max"
        default: return "cloud"
        }
    }
}

// MARK: - Battery Status View

private struct BatteryStatusView: View {
    let level: Double
    let range: Double
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: batteryIcon)
                .font(.title2)
                .foregroundColor(batteryColor)
            
            VStack(alignment: .leading) {
                Text("\(Int(level))%")
                    .font(.headline)
                Text("\(Int(range)) mi")
                    .font(.caption)
            }
        }
    }
    
    private var batteryIcon: String {
        switch level {
        case 0..<20: return "battery.0"
        case 20..<40: return "battery.25"
        case 40..<60: return "battery.50"
        case 60..<80: return "battery.75"
        default: return "battery.100"
        }
    }
    
    private var batteryColor: Color {
        switch level {
        case 0..<20: return .red
        case 20..<40: return .orange
        default: return .green
        }
    }
}

// MARK: - View Model

private class MapViewModel: ObservableObject {
    @Published var isNavigating = false
    @Published var isShowingRouteDetails = false
    @Published var currentInstruction: String?
    @Published var currentTemperature: Double = 0
    @Published var currentWeatherCondition: String = ""
    
    func startNavigation() {
        withAnimation {
            isNavigating = true
            isShowingRouteDetails = false
        }
    }
    
    func stopNavigation() {
        withAnimation {
            isNavigating = false
            currentInstruction = nil
        }
    }
}
