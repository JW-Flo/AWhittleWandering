import SwiftUI
import MapboxMaps
import Models

/// MapViewController is the main view controller for displaying the 48 Continental USA trip map
/// with route visualization, weather overlays, and vehicle tracking
struct MapViewController: View {
    // App state
    @EnvironmentObject var appState: AppState
    
    // Local state
    @State private var showSettings: Bool = false
    
    var body: some View {
        ZStack {
            // Main map view
            enhancedMapView
                .edgesIgnoringSafeArea(.all)
            
            // Overlay controls
            VStack {
                HStack {
                    Button(action: { showSettings.toggle() }) {
                        Image(systemName: "gear")
                            .font(.title2)
                            .padding(12)
                            .background(Material.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                    
                    Spacer()
                    
                    // Weather toggle
                    Button(action: { appState.showWeatherOverlays.toggle() }) {
                        Image(systemName: appState.showWeatherOverlays ? "cloud.sun.fill" : "cloud.sun")
                            .font(.title2)
                            .padding(12)
                            .background(Material.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                    
                    // Traffic toggle
                    Button(action: { appState.showTraffic.toggle() }) {
                        Image(systemName: appState.showTraffic ? "car.fill" : "car")
                            .font(.title2)
                            .padding(12)
                            .background(Material.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                }
                .padding()
                
                Spacer()
                
                // Show vehicle status if available
                if let vehicleData = appState.vehicleData {
                    VehicleStatusView(vehicleData: vehicleData)
                        .padding()
                }
                
                // Show current route info if selected
                if let route = appState.selectedRoute {
                    RouteInfoView(route: route)
                        .padding()
                }
            }
            
            // Settings sheet
            if showSettings {
                MapSettingsView(isPresented: $showSettings)
                    .transition(.move(edge: .leading))
                    .zIndex(1)
            }
        }
        .navigationTitle("48 Continental USA")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    // MARK: - Map View Configuration
    
    private var enhancedMapView: some View {
        EnhancedMapBoxView(
            initialCameraOptions: CameraOptions(
                center: appState.vehicleData?.coordinate ?? 
                         CLLocationCoordinate2D(latitude: 39.8283, longitude: -98.5795),
                zoom: 4.0,
                bearing: 0,
                pitch: 0
            ),
            styleURI: StyleURI(rawValue: appState.mapStyle.styleURI),
            routes: appState.routes,
            showUserLocation: true,
            weatherOverlaysVisible: appState.showWeatherOverlays,
            trafficVisible: appState.showTraffic,
            selectedRoute: $appState.selectedRoute
        )
        .environmentObject(appState)
    }
}

// MARK: - Supporting Views

/// Vehicle status information card
struct VehicleStatusView: View {
    let vehicleData: AppState.VehicleData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "bolt.car.fill")
                    .foregroundColor(.green)
                Text("Tesla Model 3")
                    .font(.headline)
                Spacer()
                Text("\(Int(vehicleData.speed)) mph")
                    .font(.headline)
            }
            
            HStack {
                // Battery level indicator
                BatteryIndicator(level: vehicleData.batteryLevel)
                
                Spacer()
                
                Text("\(Int(vehicleData.range)) mi")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            HStack {
                Text("Power: \(Int(vehicleData.power)) kW")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                // Show last update time
                Text(vehicleData.lastUpdate, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Material.regularMaterial)
        .cornerRadius(12)
        .shadow(radius: 3)
    }
}

/// Battery level indicator view
struct BatteryIndicator: View {
    let level: Double
    
    var body: some View {
        HStack(spacing: 2) {
            // Battery icon
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3)
                    .stroke(Color.secondary, lineWidth: 1)
                    .frame(width: 30, height: 15)
                
                RoundedRectangle(cornerRadius: 2)
                    .fill(batteryColor)
                    .frame(width: max(2, 28 * level / 100), height: 11)
                    .padding(.leading, 2)
            }
            
            // Battery percentage
            Text("\(Int(level))%")
                .font(.subheadline)
                .foregroundColor(batteryColor)
        }
    }
    
    private var batteryColor: Color {
        if level <= 20 {
            return .red
        } else if level <= 40 {
            return .orange
        } else {
            return .green
        }
    }
}

/// Route information view
struct RouteInfoView: View {
    let route: DisplayRoute
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Current Route")
                .font(.headline)
            
            HStack {
                Label("\(Int(route.totalDuration / 60)) min", systemImage: "clock")
                    .font(.subheadline)
                
                Spacer()
                
                Label(String(format: "%.1f km", route.totalDistance), systemImage: "car")
                    .font(.subheadline)
            }
            
            HStack {
                Label("\(route.requiredStops) stops", systemImage: "mappin")
                    .font(.subheadline)
                
                Spacer()
                
                // Weather risk indicator
                WeatherRiskIndicator(risk: route.weatherRisk)
            }
        }
        .padding()
        .background(Material.regularMaterial)
        .cornerRadius(12)
        .shadow(radius: 3)
    }
}

/// Weather risk indicator
struct WeatherRiskIndicator: View {
    let risk: Double
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: weatherIcon)
                .foregroundColor(riskColor)
            
            Text("\(Int(risk * 100))% risk")
                .font(.subheadline)
                .foregroundColor(riskColor)
        }
    }
    
    private var riskColor: Color {
        if risk < 0.3 {
            return .green
        } else if risk < 0.7 {
            return .orange
        } else {
            return .red
        }
    }
    
    private var weatherIcon: String {
        if risk < 0.3 {
            return "sun.max.fill"
        } else if risk < 0.7 {
            return "cloud.sun.fill"
        } else {
            return "cloud.bolt.rain.fill"
        }
    }
}

/// Map settings view
struct MapSettingsView: View {
    @Binding var isPresented: Bool
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack {
                Text("Map Settings")
                    .font(.title.bold())
                
                Spacer()
                
                Button(action: { isPresented = false }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.bottom)
            
            // Map style selector
            VStack(alignment: .leading, spacing: 8) {
                Text("Map Style")
                    .font(.headline)
                
                Picker("Map Style", selection: $appState.mapStyle) {
                    ForEach(AppState.MapStyle.allCases) { style in
                        Text(style.rawValue).tag(style)
                    }
                }
                .pickerStyle(.segmented)
            }
            
            // Weather overlay settings
            VStack(alignment: .leading, spacing: 8) {
                Text("Weather Overlays")
                    .font(.headline)
                
                Toggle("Show Weather Overlays", isOn: $appState.showWeatherOverlays)
                    .padding(.vertical, 4)
                
                Text("Overlay Types")
                    .font(.subheadline)
                
                ForEach(AppState.WeatherOverlayType.allCases) { overlayType in
                    Toggle(overlayType.rawValue, isOn: Binding(
                        get: { appState.enabledWeatherOverlays.contains(overlayType) },
                        set: { newValue in
                            if newValue {
                                appState.enabledWeatherOverlays.insert(overlayType)
                            } else {
                                appState.enabledWeatherOverlays.remove(overlayType)
                            }
                        }
                    ))
                    .disabled(!appState.showWeatherOverlays)
                    .padding(.vertical, 2)
                }
                
                // Opacity slider
                VStack(alignment: .leading, spacing: 4) {
                    Text("Overlay Opacity: \(Int(appState.weatherOverlayOpacity * 100))%")
                        .font(.subheadline)
                    
                    Slider(value: $appState.weatherOverlayOpacity, in: 0.1...1.0)
                        .disabled(!appState.showWeatherOverlays)
                }
                .padding(.top, 4)
            }
            
            // Traffic settings
            VStack(alignment: .leading, spacing: 8) {
                Text("Traffic Display")
                    .font(.headline)
                
                Toggle("Show Traffic", isOn: $appState.showTraffic)
            }
            
            Spacer()
        }
        .padding()
        .frame(width: 300)
        .background(Material.thick)
        .cornerRadius(12)
        .shadow(radius: 5)
    }
}

// MARK: - Preview

#Preview {
    NavigationView {
        MapViewController()
            .environmentObject(AppState())
    }
}
