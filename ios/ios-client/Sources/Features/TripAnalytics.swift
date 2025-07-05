import Foundation

class TripAnalytics {
    static let shared = TripAnalytics()

    private var totalMileage: Double = 0.0
    private var totalChargingTime: TimeInterval = 0.0
    private var totalChargingEnergy: Double = 0.0

    private init() {}

    func logTripSegment(mileage: Double) {
        totalMileage += mileage
    }

    func logChargingSession(duration: TimeInterval, energy: Double) {
        totalChargingTime += duration
        totalChargingEnergy += energy
    }

    func getAnalyticsSummary() -> String {
        let hours = totalChargingTime / 3600
        return
            "Total Mileage: \(totalMileage) miles\nTotal Charging Time: \(String(format: "%.1f", hours)) hours\nTotal Charging Energy: \(totalChargingEnergy) kWh"
    }
}
