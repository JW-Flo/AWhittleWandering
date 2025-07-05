import Combine
import CoreLocation
import Foundation
import MapKit
import Models
import SwiftUI

// Using DisplayRoute from Route.swift instead of local definition

@MainActor
class RouteManager: ObservableObject {
    @Published var routes: [DisplayRoute] = []
    @Published var currentRegion: MKCoordinateRegion?
    @Published var searchQuery = ""
    @Published var searchResults: [MKLocalSearchCompletion] = []
    @Published var selectedLocation: CLLocationCoordinate2D?
    @Published var error: Error?

    private let baseURL = URL(string: "https://continentalusa-edge.kd8jc7v8cd.workers.dev")!
    private let hmacKey = "test-key"
    private let searchCompleter = MKLocalSearchCompleter()
    private let jsonEncoder = JSONEncoder()
    private let jsonDecoder = JSONDecoder()

    init() {
        searchCompleter.delegate = self
    }

    func updateRegion(for location: CLLocation) {
        currentRegion = MKCoordinateRegion(
            center: location.coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
        )
    }

    func searchLocations(_ query: String) {
        searchQuery = query
        searchCompleter.queryFragment = query
    }

    func calculateRoute(from start: CLLocationCoordinate2D, to end: CLLocationCoordinate2D)
        async throws
    {
        let payload =
            [
                "origin": ["lat": start.latitude, "lon": start.longitude],
                "destination": ["lat": end.latitude, "lon": end.longitude],
                "preferences": [
                    "avoidWeather": true,
                    "maxDrivingTime": 8,
                    "requireCharging": true,
                ],
            ] as [String: Any]

        let jsonData = try JSONSerialization.data(withJSONObject: payload)
        let signature = calculateHMAC(for: jsonData)

        var request = URLRequest(url: baseURL.appendingPathComponent("optimize-route"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("sha256=\(signature)", forHTTPHeaderField: "Authorization")
        request.httpBody = jsonData

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
            httpResponse.statusCode == 200
        else {
            throw URLError(.badServerResponse)
        }

        let routeResponse = try jsonDecoder.decode(RouteResponse.self, from: data)
        let mainRoute = routeResponse.route

        let displayRoute = DisplayRoute(
            coordinates: mainRoute.coordinates.map(Coordinate.init),
            weatherRisk: mainRoute.weatherRisk,
            requiredStops: mainRoute.requiredStops,
            totalDuration: mainRoute.totalDuration,
            totalDistance: mainRoute.totalDistance
        )

        routes =
            [displayRoute]
            + routeResponse.alternatives.map { route in
                DisplayRoute(
                    coordinates: route.coordinates.map(Coordinate.init),
                    weatherRisk: route.weatherRisk,
                    requiredStops: route.requiredStops,
                    totalDuration: route.totalDuration,
                    totalDistance: route.totalDistance
                )
            }
    }

    private func calculateHMAC(for data: Data) -> String {
        // TODO: Implement HMAC-SHA256 calculation
        return "test-signature"
    }
}

extension RouteManager: MKLocalSearchCompleterDelegate {
    func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
        searchResults = completer.results
    }

    func completer(_ completer: MKLocalSearchCompleter, didFailWithError error: Error) {
        self.error = error
        searchResults = []
    }
}

// API Response Types
private struct RouteResponse: Codable {
    let route: APIRoute
    let alternatives: [APIRoute]
}

private struct APIRoute: Codable {
    let coordinates: [APICoordinate]
    let weatherRisk: Double
    let requiredStops: Int
    let totalDuration: TimeInterval
    let totalDistance: Double
}

private struct APICoordinate: Codable {
    let lat: Double
    let lon: Double

    var toCLCoordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lon)
    }
}
