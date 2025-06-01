import Foundation

class TeslaAPI {
    private let backendBaseURL = "https://your-cloud-backend.example.com" // Replace with your backend URL
    private var accessToken: String?

    init() {
        // Optionally initialize with stored token if your backend issues one
        self.accessToken = nil
    }

    func authenticate(
        username: String, password: String, completion: @escaping (Bool, Error?) -> Void
    ) {
        let url = URL(string: "\(backendBaseURL)/api/tesla/authenticate")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "email": username,
            "password": password
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
            completion(true, nil)
        }
        task.resume()
    }

    func sendCommand(
        endpoint: String, parameters: [String: Any], completion: @escaping (Bool, Error?) -> Void
    ) {
        guard let token = accessToken else {
            completion(false, nil)
            return
        }
        let url = URL(string: "\(backendBaseURL)/api/tesla/\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try? JSONSerialization.data(withJSONObject: parameters, options: [])
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
