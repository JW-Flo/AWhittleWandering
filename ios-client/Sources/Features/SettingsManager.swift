import Foundation

class SettingsManager: ObservableObject {
    static let shared = SettingsManager()

    @Published var lowSoCThreshold: Double = 15.0
    @Published var highTempThreshold: Double = 90.0

    private init() {}

    func updateLowSoCThreshold(to value: Double) {
        lowSoCThreshold = value
        saveSettings()
    }

    func updateHighTempThreshold(to value: Double) {
        highTempThreshold = value
        saveSettings()
    }

    private func saveSettings() {
        let defaults = UserDefaults.standard
        defaults.set(lowSoCThreshold, forKey: "lowSoCThreshold")
        defaults.set(highTempThreshold, forKey: "highTempThreshold")
    }

    func loadSettings() {
        let defaults = UserDefaults.standard
        lowSoCThreshold = defaults.double(forKey: "lowSoCThreshold")
        highTempThreshold = defaults.double(forKey: "highTempThreshold")
    }
}
