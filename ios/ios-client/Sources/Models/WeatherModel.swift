import Foundation

struct WeatherModel: Codable {
    let temperature: Double
    let condition: String
    let alert: String?

    enum CodingKeys: String, CodingKey {
        case temperature = "temp"
        case condition = "weather"
        case alert
    }
}
