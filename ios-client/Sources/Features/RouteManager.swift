import Combine
import Foundation
import MapKit

struct DisplayRoute: Identifiable {
    let id = UUID()
    let coordinates: [CLLocationCoordinate2D]
    let weatherRisk: Double
    let requiredStops: Int
    let totalDuration: TimeInterval
}

class RouteManager: NSObject, ObservableObject {
    @Published var destinationSearch = ""
    @Published var searchResults: [MKLocalSearchCompletion] = []
    @Published var currentRoute: DisplayRoute?

    private let searchCompleter = MKLocalSearchCompleter()
    private let edgeWorkerClient: EdgeWorkerClient
    private var searchCancellable: AnyCancellable?

    override init() {
        self.edgeWorkerClient = EdgeWorkerClient(baseURL: URL(string: "YOUR_EDGE_WORKER_URL")!)
        super.init()

        searchCompleter.delegate = self

        searchCancellable =
            $destinationSearch
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] term in
                if !term.isEmpty {
                    self?.searchCompleter.queryFragment = term
                }
            }
    }

    func selectDestination(_ result: MKLocalSearchCompletion) {
        let searchRequest = MKLocalSearch.Request(completion: result)
        let search = MKLocalSearch(request: searchRequest)

        search.start { [weak self] response, error in
            guard let self = self,
                let location = response?.mapItems.first?.placemark.coordinate
            else {
                return
            }

            Task {
                await self.calculateRoute(to: location)
            }
        }
    }

    @MainActor
    private func calculateRoute(to destination: CLLocationCoordinate2D) async {
        let cache = CacheManager.shared
        let startLocation = CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194)  // Replace with actual location

        // Generate a deterministic ID for this route
        let routeId = UUID(
            uuidString: String(
                format: "route-%0.6f,%0.6f-%0.6f,%0.6f",
                startLocation.latitude, startLocation.longitude,
                destination.latitude, destination.longitude
            ))!

        // Check cache first
        if let cachedRoute = cache.getCachedRoute(id: routeId) {
            self.currentRoute = cachedRoute
            return
        }

        do {
            let route = try await edgeWorkerClient.calculateRoute(
                start: startLocation,
                end: destination,
                currentSoC: 90
            )

            // Cache the route
            cache.cacheRoute(route)
            self.currentRoute = route
        } catch {
            print("Failed to calculate route: \(error)")
        }
    }
}

extension RouteManager: MKLocalSearchCompleterDelegate {
    func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
        searchResults = completer.results
    }

    func completer(_ completer: MKLocalSearchCompleter, didFailWithError error: Error) {
        print("Search failed with error: \(error.localizedDescription)")
    }
}

struct EdgeWorkerClient {
    let baseURL: URL

    func calculateRoute(
        start: CLLocationCoordinate2D, end: CLLocationCoordinate2D, currentSoC: Double
    ) async throws -> DisplayRoute {
        var components = URLComponents(
            url: baseURL.appendingPathComponent("route"), resolvingAgainstBaseURL: true)!
        components.queryItems = [
            URLQueryItem(name: "startLat", value: "\(start.latitude)"),
            URLQueryItem(name: "startLong", value: "\(start.longitude)"),
            URLQueryItem(name: "endLat", value: "\(end.latitude)"),
            URLQueryItem(name: "endLong", value: "\(end.longitude)"),
            URLQueryItem(name: "soc", value: "\(currentSoC)"),
        ]

        let request = URLRequest(url: components.url!)
        let (data, _) = try await URLSession.shared.data(for: request)
        let decoder = JSONDecoder()
        let response = try decoder.decode(EdgeWorkerRouteResponse.self, from: data)

        return DisplayRoute(
            coordinates: response.route.segments.flatMap { [$0.startPoint, $0.endPoint] }.map {
                CLLocationCoordinate2D(latitude: $0[0], longitude: $0[1])
            },
            weatherRisk: response.route.weatherRisk,
            requiredStops: response.route.requiredStops,
            totalDuration: response.route.totalDuration
        )
    }
}

struct EdgeWorkerRouteResponse: Codable {
    let route: EdgeWorkerRouteData
}

struct EdgeWorkerRouteData: Codable {
    let segments: [EdgeWorkerRouteSegment]
    let weatherRisk: Double
    let requiredStops: Int
    let totalDuration: TimeInterval
}

struct EdgeWorkerRouteSegment: Codable {
    let startPoint: [Double]
    let endPoint: [Double]
}
