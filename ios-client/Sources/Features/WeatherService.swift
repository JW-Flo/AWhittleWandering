import Foundation
import Combine
import CoreLocation

class WeatherService: ObservableObject {
    static let shared = WeatherService()

    @Published var weatherData: [String: Any] = [:]

    private var cancellables = Set<AnyCancellable>()

    func fetchWeather(for location: CLLocationCoordinate2D) {
        let urlString = "https://api.weather.gov/points/\(location.latitude),\(location.longitude)/forecast"
        guard let url = URL(string: urlString) else { return }

        URLSession.shared.dataTaskPublisher(for: url)
            .map { $0.data }
            .decode(type: [String: Any].self, decoder: JSONDecoder())
            .replaceError(with: [:])
            .receive(on: DispatchQueue.main)
            .sink { [weak self] data in
                self?.weatherData = data
            }
            .store(in: &cancellables)
    }
}
