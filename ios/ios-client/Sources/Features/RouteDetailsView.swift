import SwiftUI

struct RouteDetailsView: View {
    let route: DisplayRoute

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Route Details")
                .font(.headline)

            Group {
                Text("Weather Risk: \(Int(route.weatherRisk * 100))%")
                    .foregroundColor(riskColor)
                Text("Required Stops: \(route.requiredStops)")
                Text("Duration: \(formatDuration(route.totalDuration))")
                Text("Distance: \(formatDistance(route.totalDistance))")
            }
            .font(.subheadline)
        }
        .padding()
        .background(Color(.windowBackgroundColor))
        .cornerRadius(10)
        .shadow(radius: 5)
    }

    private var riskColor: Color {
        if route.weatherRisk < 0.3 { return .green }
        if route.weatherRisk < 0.7 { return .yellow }
        return .red
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = [.hour, .minute]
        formatter.unitsStyle = .abbreviated
        return formatter.string(from: duration) ?? "Unknown"
    }

    private func formatDistance(_ distance: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 1
        let kilometers = distance
        return "\(formatter.string(from: NSNumber(value: kilometers)) ?? "Unknown") km"
    }
}
