import SwiftUI

struct DashboardView: View {
    @State private var mileage: Double = 0.0
    @State private var targetSoC: Double = 80.0
    @State private var eta: String = "--:--"
    @State private var cabinTemp: Double = 72.0
    @State private var batteryDrainEstimate: Double = 5.0
    @State private var alerts: [String] = []

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Today's Legs
                VStack(alignment: .leading) {
                    Text("Today's Legs")
                        .font(.headline)
                    Text("Mileage: \(mileage, specifier: "%.1f") miles")
                    Text("Target SoC: \(targetSoC, specifier: "%.0f")%")
                    Text("ETA: \(eta)")
                }
                .padding()
                .background(Color.gray.opacity(0.2))
                .cornerRadius(10)

                // Dog-Mode Watch
                VStack(alignment: .leading) {
                    Text("Dog-Mode Watch")
                        .font(.headline)
                    Text("Cabin Temp: \(cabinTemp, specifier: "%.1f")°F")
                    Text("Battery Drain Estimate: \(batteryDrainEstimate, specifier: "%.1f") kWh")
                }
                .padding()
                .background(Color.gray.opacity(0.2))
                .cornerRadius(10)

                // Alerts Feed
                VStack(alignment: .leading) {
                    Text("Alerts")
                        .font(.headline)
                    ForEach(alerts, id: \.self) { alert in
                        Text(alert)
                            .foregroundColor(.red)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.2))
                .cornerRadius(10)

                Spacer()
            }
            .padding()
            .navigationTitle("Dashboard")
        }
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
    }
}
