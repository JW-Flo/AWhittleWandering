import MapKit
import SwiftUI

@available(macOS 11.0, *)
struct MapView: View {
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
    )

    @State private var chargers: [ChargerAnnotation] = []

    var body: some View {
        if #available(macOS 11.0, *) {
            Map(coordinateRegion: $region, showsUserLocation: false, annotationItems: chargers) {
                charger in
                MapAnnotation(coordinate: charger.coordinate) {
                    Circle()
                        .fill(charger.color)
                        .frame(width: 10, height: 10)
                }
            }
            .navigationTitle("Map")
        } else {
            Text("Map is not available on this macOS version")
        }
    }

    private func loadChargers() {
        // Placeholder for loading charger data
        chargers = [
            ChargerAnnotation(
                coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
                color: .green),
            ChargerAnnotation(
                coordinate: CLLocationCoordinate2D(latitude: 37.8044, longitude: -122.2711),
                color: .red),
        ]
    }
}

struct ChargerAnnotation: Identifiable {
    let id = UUID()
    let coordinate: CLLocationCoordinate2D
    let color: Color
}

@available(macOS 11.0, *)
struct MapView_Previews: PreviewProvider {
    static var previews: some View {
        if #available(macOS 11.0, *) {
            MapView()
        } else {
            Text("Not available on this macOS version")
        }
    }
}
