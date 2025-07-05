import MapKit
import Models
import SwiftUI

struct MapView: View {
    @State private var selectedRoute: DisplayRoute? = DisplayRoute.preview
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 5, longitudeDelta: 5)
    )

    var body: some View {
        NavigationView {
            ZStack {
                Map(coordinateRegion: $region, annotationItems: selectedRoute?.coordinates ?? []) {
                    coordinate in
                    MapMarker(coordinate: coordinate.toCLCoordinate)
                }
                .edgesIgnoringSafeArea(.all)

                VStack {
                    Spacer()
                    if let route = selectedRoute {
                        RouteInfoCard(route: route)
                            .padding()
                    }
                }
            }
            .navigationTitle("Continental USA")
        }
    }
}

struct RouteInfoCard: View {
    let route: DisplayRoute

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Route Details")
                .font(.headline)

            HStack {
                Label("\(Int(route.totalDuration / 60)) min", systemImage: "clock")
                Spacer()
                Label(String(format: "%.1f km", route.totalDistance), systemImage: "car")
            }

            HStack {
                Label("\(route.requiredStops) stops", systemImage: "location.circle")
                Spacer()
                Label("\(Int(route.weatherRisk * 100))% risk", systemImage: "cloud.rain")
            }
        }
        .padding()
        .background(Material.regular)
        .cornerRadius(12)
        .shadow(radius: 5)
    }
}

#Preview {
    MapView()
        .frame(width: 800, height: 600)
}
