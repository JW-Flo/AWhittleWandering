import CryptoKit
import Foundation

class EdgeWorkerIntegration {
    static let shared = EdgeWorkerIntegration()

    private init() {}

    func syncVisits(visits: [[String: Any]], hmacKey: String, completion: @escaping (Bool) -> Void)
    {
        guard let url = URL(string: "https://your-worker-endpoint/v1/sync") else {
            completion(false)
            return
        }

        let jsonData = try! JSONSerialization.data(withJSONObject: visits)
        let key = SymmetricKey(data: Data(hmacKey.utf8))
        let signature = HMAC<SHA256>.authenticationCode(for: jsonData, using: key)
        let signatureString = Data(signature).base64EncodedString()

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = jsonData
        request.addValue(signatureString, forHTTPHeaderField: "X-Sig")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Sync failed: \(error)")
                completion(false)
                return
            }

            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                print("Sync successful")
                completion(true)
            } else {
                print("Sync failed with response: \(String(describing: response))")
                completion(false)
            }
        }.resume()
    }

    func exchangeTeslaAuthCode(
        authCode: String, clientID: String, clientSecret: String,
        completion: @escaping ([String: Any]?) -> Void
    ) {
        guard let url = URL(string: "https://your-worker-endpoint/tesla/exchange") else {
            completion(nil)
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "code": authCode,
            "client_id": clientID,
            "client_secret": clientSecret,
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Exchange failed: \(error)")
                completion(nil)
                return
            }

            if let data = data,
                let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            {
                print("Exchange successful: \(json)")
                completion(json)
            } else {
                print("Exchange failed with response: \(String(describing: response))")
                completion(nil)
            }
        }.resume()
    }
}
