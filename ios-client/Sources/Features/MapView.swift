import MapKit
import SwiftUI

struct RoutePoint: Identifiable {
    let id = UUID()
    let coordinate: CLLocationCoordinate2D
    let type: PointType
    let info: String

    enum PointType {
        case start
        case end
        case charger
        case weatherWarning
    }
}

struct Route: Identifiable {
    let id = UUID()
    let coordinates: [CLLocationCoordinate2D]
    let weatherRisk: Double
    let requiredStops: Int
    let totalDuration: TimeInterval
}

@available(macOS 11.0, *)
struct MapView: View {
    @StateObject private var locationManager = LocationManager()
    @StateObject private var routeManager = RouteManager()

    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
    )

    @State private var points: [RoutePoint] = []
    @State private var selectedPoint: RoutePoint?
    @State private var isRoutePlanning = false

    var body: some View {
        ZStack {
            Map(coordinateRegion: $region, showsUserLocation: true, annotationItems: points) {
                point in
                MapAnnotation(coordinate: point.coordinate) {
                    Button(action: { selectedPoint = point }) {
                        switch point.type {
                        case .start:
                            Image(systemName: "car.fill")
                                .foregroundColor(.blue)
                        case .end:
                            Image(systemName: "flag.fill")
                                .foregroundColor(.red)
                        case .charger:
                            Image(systemName: "bolt.fill")
                                .foregroundColor(.green)
                        case .weatherWarning:
                            Image(systemName: "cloud.bolt.fill")
                                .foregroundColor(.orange)
                        }
                    }
                }
            }
            .overlay(
                routeManager.currentRoute.map { route in
                    Path { path in
                        guard let first = route.coordinates.first else { return }
                        path.move(to: point(for: first))
                        route.coordinates.dropFirst().forEach { coord in
                            path.addLine(to: point(for: coord))
                        }
                    }
                    .stroke(routeColor(for: route.weatherRisk), lineWidth: 3)
                }
            )

            if isRoutePlanning {
                VStack {
                    TextField("Destination", text: $routeManager.destinationSearch)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .padding()

                    if !routeManager.searchResults.isEmpty {
                        List(routeManager.searchResults, id: \.self) { result in
                            Text(result.title)
                                .onTapGesture {
                                    routeManager.selectDestination(result)
                                    isRoutePlanning = false
                                }
                        }
                    }
                }
                .background(Color(.systemBackground))
                .cornerRadius(10)
                .padding()
            }

            VStack {
                Spacer()
                HStack {
                    Button(action: { isRoutePlanning.toggle() }) {
                        Image(systemName: "location.fill")
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .clipShape(Circle())
                    }
                    if let route = routeManager.currentRoute {
                        Text("\(Int(route.totalDuration / 60)) min")
                            .padding(.horizontal)
                        Text("\(route.requiredStops) stops")
                            .padding(.horizontal)
                    }
                }
                .padding()
            }
        }
        .sheet(item: $selectedPoint) { point in
            PointDetailView(point: point)
        }
        .onAppear {
            locationManager.requestAuthorization()
            configureMap()
        }
    }

    private func point(for coordinate: CLLocationCoordinate2D) -> CGPoint {
        let rect = UIScreen.main.bounds
        let latRad = coordinate.latitude * .pi / 180
        let x = (coordinate.longitude + 180) * (rect.width / 360)
        let y = (1 - asinh(tan(latRad)) / .pi) * rect.height / 2
        return CGPoint(x: x, y: y)
    }

    private func routeColor(for risk: Double) -> Color {
        switch risk {
        case 0...0.3: return .blue
        case 0.3...0.6: return .yellow
        default: return .red
        }
    }

    private func configureMap() {
        let overlay = TileOverlay()
        overlay.canReplaceMapContent = true

        let options = MKMapSnapshotter.Options()
        options.region = region
        options.scale = UIScreen.main.scale
        options.size = UIScreen.main.bounds.size

        let snapshotter = MKMapSnapshotter(options: options)
        snapshotter.start { [weak self] snapshot, error in
            guard let snapshot = snapshot else { return }

            // Pre-cache visible tiles
            let tiles = self?.visibleTilePaths(for: snapshot) ?? []
            for tile in tiles {
                _ = overlay.loadTile(at: tile) { _, _ in }
            }
        }
    }

    private func visibleTilePaths(for snapshot: MKMapSnapshotter.Snapshot) -> [MKTileOverlayPath] {
        let rect = snapshot.image.extent
        let zoomLevel = Int(log2(360 * rect.width / (region.span.longitudeDelta * 256)))

        let minLat = region.center.latitude - region.span.latitudeDelta / 2
        let maxLat = region.center.latitude + region.span.latitudeDelta / 2
        let minLon = region.center.longitude - region.span.longitudeDelta / 2
        let maxLon = region.center.longitude + region.span.longitudeDelta / 2

        var paths: [MKTileOverlayPath] = []

        for x in minTileX(for: minLon, zoom: zoomLevel)...maxTileX(for: maxLon, zoom: zoomLevel) {
            for y in minTileY(for: maxLat, zoom: zoomLevel)...maxTileY(for: minLat, zoom: zoomLevel)
            {
                paths.append(MKTileOverlayPath(x: x, y: y, z: zoomLevel))
            }
        }

        return paths
    }

    private func minTileX(for longitude: Double, zoom: Int) -> Int {
        Int((longitude + 180.0) / 360.0 * pow(2.0, Double(zoom)))
    }

    private func maxTileX(for longitude: Double, zoom: Int) -> Int {
        Int((longitude + 180.0) / 360.0 * pow(2.0, Double(zoom)))
    }

    private func minTileY(for latitude: Double, zoom: Int) -> Int {
        let latRad = latitude * .pi / 180.0
        let n = pow(2.0, Double(zoom))
        return Int(n * (1.0 - asinh(tan(latRad)) / .pi) / 2.0)
    }

    private func maxTileY(for latitude: Double, zoom: Int) -> Int {
        let latRad = latitude * .pi / 180.0
        let n = pow(2.0, Double(zoom))
        return Int(n * (1.0 - asinh(tan(latRad)) / .pi) / 2.0)
    }
}

class TileOverlay: MKTileOverlay {
    private let cache = CacheManager.shared

    override func loadTile(
        at path: MKTileOverlayPath,
        result: @escaping (Data?, Error?) -> Void
    ) {
        // Check cache first
        if let cachedData = cache.getCachedMapTile(
            z: Int(path.z),
            x: Int(path.x),
            y: Int(path.y)
        ) {
            result(cachedData, nil)
            return
        }

        // If not in cache, fetch from edge worker
        let url = URL(string: "https://YOUR_EDGE_WORKER_URL/tile/\(path.z)/\(path.x)/\(path.y)")!

        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            if let error = error {
                result(nil, error)
                return
            }

            guard let data = data else {
                result(nil, NSError(domain: "MapTileError", code: -1))
                return
            }

            // Cache the tile
            self?.cache.cacheMapTile(data, z: Int(path.z), x: Int(path.x), y: Int(path.y))
            result(data, nil)
        }.resume()
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
