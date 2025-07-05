import Foundation

struct VehicleState: Codable {
    let batteryLevel: Int
    let chargingState: String
    let latitude: Double
    let longitude: Double
    let speed: Double?
    let timestamp: Date
    let range: Double
}

enum TeslaError: Error {
    case authenticationFailed
    case networkError
    case invalidResponse
}

class TeslaAPI {
    private let backendBaseURL: String
    private var accessToken: String?
    private var selectedVehicleId: String?

    init(backendURL: String = "https://api.tesla.com") {
        self.backendBaseURL = backendURL
        // Try to load saved token
        self.accessToken = UserDefaults.standard.string(forKey: "teslaAccessToken")
    }

    func authenticate(username: String, password: String) async throws -> Bool {
        let url = URL(string: "\(backendBaseURL)/oauth/token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "grant_type": "password",
            "client_id": "ownerapi",
            "email": username,
            "password": password,
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
            httpResponse.statusCode == 200,
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let token = json["access_token"] as? String
        else {
            throw TeslaError.authenticationFailed
        }

        self.accessToken = token
        UserDefaults.standard.set(token, forKey: "teslaAccessToken")
        return true
    }

    func getVehicles() async throws -> [[String: Any]] {
        guard let token = accessToken else {
            throw TeslaError.authenticationFailed
        }

        let url = URL(string: "\(backendBaseURL)/api/1/vehicles")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
            httpResponse.statusCode == 200,
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let vehicles = json["response"] as? [[String: Any]]
        else {
            throw TeslaError.invalidResponse
        }

        return vehicles
    }

    func getVehicleState() async throws -> VehicleState {
        guard let token = accessToken, let vehicleId = selectedVehicleId else {
            throw TeslaError.authenticationFailed
        }

        let url = URL(string: "\(backendBaseURL)/api/1/vehicles/\(vehicleId)/vehicle_data")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
            httpResponse.statusCode == 200,
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let response = json["response"] as? [String: Any],
            let driveState = response["drive_state"] as? [String: Any],
            let chargeState = response["charge_state"] as? [String: Any]
        else {
            throw TeslaError.invalidResponse
        }

        return VehicleState(
            batteryLevel: chargeState["battery_level"] as? Int ?? 0,
            chargingState: chargeState["charging_state"] as? String ?? "Disconnected",
            latitude: driveState["latitude"] as? Double ?? 0,
            longitude: driveState["longitude"] as? Double ?? 0,
            speed: driveState["speed"] as? Double,
            timestamp: Date(),
            range: chargeState["battery_range"] as? Double ?? 0
        )
    }

    func setVehicle(id: String) {
        self.selectedVehicleId = id
    }

    func startCharging() async throws {
        guard let vehicleId = selectedVehicleId else {
            throw TeslaError.invalidResponse
        }
        try await sendCommand("charge_start", vehicleId: vehicleId)
    }

    func stopCharging() async throws {
        guard let vehicleId = selectedVehicleId else {
            throw TeslaError.invalidResponse
        }
        try await sendCommand("charge_stop", vehicleId: vehicleId)
    }

    private func sendCommand(_ command: String, vehicleId: String) async throws {
        guard let token = accessToken else {
            throw TeslaError.authenticationFailed
        }

        let url = URL(string: "\(backendBaseURL)/api/1/vehicles/\(vehicleId)/command/\(command)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
            httpResponse.statusCode == 200
        else {
            throw TeslaError.networkError
        }
    }
}
