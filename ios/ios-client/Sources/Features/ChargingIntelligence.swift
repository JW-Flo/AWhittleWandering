import Combine
import Foundation

class ChargingIntelligence: ObservableObject {
    @Published var stateOfCharge: Double = 0.0
    private var cancellables = Set<AnyCancellable>()

    func authenticateWithTeslaAPI(clientID: String, clientSecret: String, authCode: String) {
        let tokenURL = URL(string: "https://auth.tesla.com/oauth2/v3/token")!
        var request = URLRequest(url: tokenURL)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "grant_type": "authorization_code",
            "client_id": clientID,
            "client_secret": clientSecret,
            "code": authCode,
            "redirect_uri": "https://your-app-callback-url",
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Tesla API authentication failed: \(error)")
                return
            }

            if let data = data,
                let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            {
                print("Tesla API authentication successful: \(json)")
                // Store access and refresh tokens securely
            }
        }.resume()
    }

    func fetchStateOfCharge(vehicleID: String, accessToken: String) {
        let statusURL = URL(
            string:
                "https://owner-api.teslamotors.com/api/1/vehicles/\(vehicleID)/data_request/charge_state"
        )!
        var request = URLRequest(url: statusURL)
        request.httpMethod = "GET"
        request.addValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Failed to fetch state of charge: \(error)")
                return
            }

            if let data = data,
                let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                let response = json["response"] as? [String: Any],
                let soc = response["battery_level"] as? Double
            {
                DispatchQueue.main.async {
                    self.stateOfCharge = soc
                }
            }
        }.resume()
    }
}
