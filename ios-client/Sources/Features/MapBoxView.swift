import MapKit
import SwiftUI

struct MapBoxView: View {
    let routes: [DisplayRoute]
    @Binding var selectedRoute: DisplayRoute?

    var body: some View {
        Map(
            coordinateRegion: .constant(
                MKCoordinateRegion(
                    center: CLLocationCoordinate2D(latitude: 39.8283, longitude: -98.5795),
                    span: MKCoordinateSpan(latitudeDelta: 50, longitudeDelta: 50)
                )
            ),
            showsUserLocation: true,
            userTrackingMode: .constant(.follow)
        ) {
            ForEach(routes) { route in
                MapPolyline(coordinates: route.coordinates)
                    .strokeColor(
                        route.weatherRisk < 0.3 ? .green : route.weatherRisk < 0.7 ? .yellow : .red
                    )
                    .lineWidth(3)
            }
        }
    }
}
