import Foundation

class TeslaAPI {
    private let baseURL = "https://owner-api.teslamotors.com"
    private let clientID = "<YOUR_CLIENT_ID>"  // Replace with actual client ID
    private let clientSecret = "<YOUR_CLIENT_SECRET>"  // Replace with actual client secret
    private var accessToken: String?

    init() {
        // Initialize with stored token if available
        self.accessToken = UserDefaults.standard.string(forKey: "TeslaAccessToken")
    }

    func authenticate(
        username: String, password: String, completion: @escaping (Bool, Error?) -> Void
    ) {
        let url = URL(string: "\(baseURL)/oauth/token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "grant_type": "password",
            "client_id": clientID,
            "client_secret": clientSecret,
            "email": username,
            "password": password,
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: body, options: [])

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(false, error)
                return
            }

            guard let data = data,
                let json = try? JSONSerialization.jsonObject(with: data, options: [])
                    as? [String: Any],
                let token = json["access_token"] as? String
            else {
                completion(false, nil)
                return
            }

            self.accessToken = token
            UserDefaults.standard.set(token, forKey: "TeslaAccessToken")
            completion(true, nil)
        }

        task.resume()
    }

    func navigateTo(
        latitude: Double, longitude: Double, completion: @escaping (Bool, Error?) -> Void
    ) {
        guard let accessToken = accessToken else {
            completion(false, nil)
            return
        }

        let url = URL(string: "\(baseURL)/api/1/vehicles/<VEHICLE_ID>/command/navigation_request")!  // Replace <VEHICLE_ID>
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "type": "share_ext_content_raw",
            "value": [
                "android.intent.extra.TEXT": "tesla://nav?addr=\(latitude),\(longitude)"
            ],
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: body, options: [])

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(false, error)
                return
            }

            completion(true, nil)
        }

        task.resume()
    }
}
