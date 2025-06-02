import SwiftUI

struct RouteListView: View {
    let routes: [DisplayRoute]
    @Binding var selectedRoute: DisplayRoute?

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                ForEach(routes) { route in
                    Button(action: {
                        selectedRoute = route
                    }) {
                        HStack {
                            Circle()
                                .fill(weatherRiskColor(route.weatherRisk))
                                .frame(width: 12, height: 12)

                            VStack(alignment: .leading) {
                                Text("\(formatDistance(route.totalDistance))")
                                    .font(.headline)
                                Text(
                                    "\(route.requiredStops) stops • \(formatDuration(route.totalDuration))"
                                )
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            }

                            Spacer()

                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(Color(.controlBackgroundColor))
                        .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding()
        }
    }

    private func weatherRiskColor(_ risk: Double) -> Color {
        if risk < 0.3 { return .green }
        if risk < 0.7 { return .yellow }
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
        return "\(formatter.string(from: NSNumber(value: distance)) ?? "Unknown") km"
    }
}
