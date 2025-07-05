import SwiftUI
import MapboxMaps

public struct WeatherOverlayView: View {
    @ObservedObject private var weatherService = WeatherService.shared
    private let mapView: MapView
    
    public init(mapView: MapView) {
        self.mapView = mapView
    }
    
    public var body: some View {
        ZStack {
            // Weather Alert Banner
            if let alert = weatherService.weatherData["alert"] as? String {
                weatherAlertBanner(alert)
            }
            
            // Weather Info Panel
            weatherInfoPanel
        }
        .onChange(of: weatherService.weatherData) { _ in
            updateWeatherLayers()
        }
    }
    
    private func weatherAlertBanner(_ alert: String) -> some View {
        VStack {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.yellow)
                Text(alert)
                    .font(.caption)
                    .foregroundColor(.white)
            }
            .padding(8)
            .background(Color.black.opacity(0.7))
            .cornerRadius(8)
            
            Spacer()
        }
        .padding(.top, 4)
    }
    
    private var weatherInfoPanel: some View {
        VStack {
            Spacer()
            
            HStack {
                // Current Weather
                if let temp = weatherService.weatherData["temp"] as? Double,
                   let condition = weatherService.weatherData["weather"] as? String {
                    HStack(spacing: 12) {
                        weatherIcon(for: condition)
                        
                        VStack(alignment: .leading) {
                            Text("\(Int(temp))°F")
                                .font(.title3)
                                .fontWeight(.bold)
                            Text(condition)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(radius: 2)
                }
                
                Spacer()
            }
            .padding()
        }
    }
    
    private func weatherIcon(for condition: String) -> some View {
        let systemName: String
        switch condition.lowercased() {
        case let c where c.contains("rain"):
            systemName = "cloud.rain"
        case let c where c.contains("snow"):
            systemName = "cloud.snow"
        case let c where c.contains("cloud"):
            systemName = "cloud"
        case let c where c.contains("sun"):
            systemName = "sun.max"
        case let c where c.contains("thunder"):
            systemName = "cloud.bolt"
        case let c where c.contains("fog"):
            systemName = "cloud.fog"
        default:
            systemName = "cloud"
        }
        
        return Image(systemName: systemName)
            .font(.title2)
            .foregroundColor(.primary)
    }
    
    // MARK: - Weather Layer Management
    
    private func updateWeatherLayers() {
        // Remove existing weather layers
        removeWeatherLayers()
        
        // Add new weather layers based on current conditions
        if let condition = weatherService.weatherData["weather"] as? String {
            switch condition.lowercased() {
            case let c where c.contains("rain"):
                addRainLayer()
            case let c where c.contains("snow"):
                addSnowLayer()
            case let c where c.contains("thunder"):
                addThunderstormLayer()
            default:
                break
            }
        }
    }
    
    private func removeWeatherLayers() {
        try? mapView.mapboxMap.style.removeLayer(withId: "rain-layer")
        try? mapView.mapboxMap.style.removeLayer(withId: "snow-layer")
        try? mapView.mapboxMap.style.removeLayer(withId: "thunder-layer")
    }
    
    private func addRainLayer() {
        let layer = FillLayer(id: "rain-layer")
        layer.fillColor = .constant(UIColor.blue.withAlphaComponent(0.2).cgColor)
        layer.fillOpacity = .constant(0.5)
        
        try? mapView.mapboxMap.style.addLayer(layer)
    }
    
    private func addSnowLayer() {
        let layer = FillLayer(id: "snow-layer")
        layer.fillColor = .constant(UIColor.white.withAlphaComponent(0.3).cgColor)
        layer.fillOpacity = .constant(0.5)
        
        try? mapView.mapboxMap.style.addLayer(layer)
    }
    
    private func addThunderstormLayer() {
        let layer = FillLayer(id: "thunder-layer")
        layer.fillColor = .constant(UIColor.yellow.withAlphaComponent(0.2).cgColor)
        layer.fillOpacity = .constant(0.5)
        
        try? mapView.mapboxMap.style.addLayer(layer)
    }
}

// MARK: - Preview Provider

struct WeatherOverlayView_Previews: PreviewProvider {
    static var previews: some View {
        // Create a mock MapView for preview
        let mapView = MapView(frame: .zero)
        
        return WeatherOverlayView(mapView: mapView)
            .previewLayout(.sizeThatFits)
    }
}
