import SwiftUI

struct PointDetailView: View {
    let point: RoutePoint
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(alignment: .leading, spacing: 16) {
                switch point.type {
                case .start:
                    startPointView
                case .end:
                    endPointView
                case .charger:
                    chargerPointView
                case .weatherWarning:
                    weatherWarningView
                }
            }
            .padding()
            .navigationTitle(title)
            .toolbar {
                Button("Done") {
                    dismiss()
                }
            }
        }
    }

    private var title: String {
        switch point.type {
        case .start: return "Starting Point"
        case .end: return "Destination"
        case .charger: return "Charging Station"
        case .weatherWarning: return "Weather Warning"
        }
    }

    private var startPointView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Current Location")
                .font(.headline)
            Text(point.info)
                .font(.body)
                .foregroundColor(.secondary)
        }
    }

    private var endPointView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Destination")
                .font(.headline)
            Text(point.info)
                .font(.body)
                .foregroundColor(.secondary)
        }
    }

    private var chargerPointView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Tesla Supercharger")
                .font(.headline)
            Text(point.info)
                .font(.body)
                .foregroundColor(.secondary)

            Divider()

            HStack {
                VStack(alignment: .leading) {
                    Text("Status")
                        .font(.subheadline)
                    Text("Available")
                        .foregroundColor(.green)
                }

                Spacer()

                VStack(alignment: .trailing) {
                    Text("Charging Rate")
                        .font(.subheadline)
                    Text("250 kW")
                        .foregroundColor(.secondary)
                }
            }

            Button(action: {
                // Navigate to charger
            }) {
                Text("Navigate to Charger")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
        }
    }

    private var weatherWarningView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weather Alert")
                .font(.headline)
            Text(point.info)
                .font(.body)
                .foregroundColor(.secondary)

            Divider()

            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                Text("Caution Required")
                    .foregroundColor(.orange)
            }

            Button(action: {
                // Show alternate routes
            }) {
                Text("Show Alternate Routes")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
        }
    }
}
