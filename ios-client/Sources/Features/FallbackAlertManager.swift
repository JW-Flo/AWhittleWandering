import AVFoundation
import Foundation

class FallbackAlertManager {
    static let shared = FallbackAlertManager()

    private var audioPlayer: AVAudioPlayer?

    private init() {}

    func triggerCriticalAlert(forSoC soc: Double) {
        guard soc < 10 else { return }

        // Play audible alert
        if let soundURL = Bundle.main.url(forResource: "critical_alert", withExtension: "mp3") {
            do {
                audioPlayer = try AVAudioPlayer(contentsOf: soundURL)
                audioPlayer?.play()
            } catch {
                print("Failed to play alert sound: \(error)")
            }
        }

        // Show fallback list
        showFallbackList()
    }

    private func showFallbackList() {
        let fallbackList = [
            "Level-2 Charger: 123 Main St, Springfield",
            "Level-2 Charger: 456 Elm St, Shelbyville",
        ]

        print("Fallback chargers:")
        fallbackList.forEach { print($0) }
    }
}
