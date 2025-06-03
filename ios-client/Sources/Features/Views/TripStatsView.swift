import SwiftUI

public struct TripStatsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var selectedTimeRange: TimeRange = .week
    
    private enum TimeRange: String, CaseIterable {
        case day = "24h"
        case week = "7d"
        case month = "30d"
        case total = "Total"
    }
    
    public var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Time Range Selector
                    timeRangeSelector
                    
                    // States Progress
                    statesProgressCard
                    
                    // Trip Statistics
                    tripStatsGrid
                    
                    // Charts
                    VStack(spacing: 16) {
                        distanceChart
                        energyChart
                        speedChart
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("Trip Statistics")
            .background(Color(.systemGroupedBackground))
        }
    }
    
    // MARK: - Components
    
    private var timeRangeSelector: some View {
        Picker("Time Range", selection: $selectedTimeRange) {
            ForEach(TimeRange.allCases, id: \.self) { range in
                Text(range.rawValue).tag(range)
            }
        }
        .pickerStyle(.segmented)
        .padding(.horizontal)
    }
    
    private var statesProgressCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("States Progress")
                .font(.headline)
            
            // Progress Ring
            HStack {
                ZStack {
                    Circle()
                        .stroke(Color.blue.opacity(0.2), lineWidth: 8)
                    
                    Circle()
                        .trim(from: 0, to: statesProgress)
                        .stroke(Color.blue, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    
                    VStack {
                        Text("\(statesVisited)")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("of 48")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(width: 100, height: 100)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Recent States")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    ForEach(recentStates.prefix(3), id: \.self) { state in
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text(state)
                        }
                    }
                }
                .padding(.leading)
                
                Spacer()
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
        .padding(.horizontal)
    }
    
    private var tripStatsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            StatCard(
                title: "Total Distance",
                value: String(format: "%.0f", totalDistance),
                unit: "miles",
                icon: "map"
            )
            
            StatCard(
                title: "Avg Speed",
                value: String(format: "%.0f", averageSpeed),
                unit: "mph",
                icon: "speedometer"
            )
            
            StatCard(
                title: "Energy Used",
                value: String(format: "%.1f", energyUsed),
                unit: "kWh",
                icon: "bolt.circle"
            )
            
            StatCard(
                title: "Charging Stops",
                value: "\(chargingStops)",
                unit: "stops",
                icon: "battery.100"
            )
        }
        .padding(.horizontal)
    }
    
    private var distanceChart: some View {
        ChartCard(
            title: "Daily Distance",
            data: distanceData,
            color: .blue
        )
    }
    
    private var energyChart: some View {
        ChartCard(
            title: "Energy Consumption",
            data: energyData,
            color: .green
        )
    }
    
    private var speedChart: some View {
        ChartCard(
            title: "Average Speed",
            data: speedData,
            color: .orange
        )
    }
    
    // MARK: - Helper Views
    
    private struct StatCard: View {
        let title: String
        let value: String
        let unit: String
        let icon: String
        
        var body: some View {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: icon)
                        .foregroundColor(.blue)
                    Text(title)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                HStack(alignment: .firstTextBaseline) {
                    Text(value)
                        .font(.title2)
                        .fontWeight(.bold)
                    Text(unit)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 2)
        }
    }
    
    private struct ChartCard: View {
        let title: String
        let data: [Double]
        let color: Color
        
        var body: some View {
            VStack(alignment: .leading, spacing: 12) {
                Text(title)
                    .font(.headline)
                
                // Simple bar chart
                HStack(alignment: .bottom, spacing: 4) {
                    ForEach(data.indices, id: \.self) { index in
                        VStack {
                            Rectangle()
                                .fill(color)
                                .frame(height: CGFloat(data[index]) * 100)
                            
                            Text("\(index + 1)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .frame(height: 100)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 2)
        }
    }
    
    // MARK: - Sample Data (Replace with real data from AppState)
    
    private var statesProgress: Double {
        Double(statesVisited) / 48.0
    }
    
    private var statesVisited: Int {
        appState.currentTrip?.statesVisited.count ?? 0
    }
    
    private var recentStates: [String] {
        appState.currentTrip?.statesVisited.suffix(3) ?? []
    }
    
    private var totalDistance: Double {
        appState.currentTrip?.milesCompleted ?? 0
    }
    
    private var averageSpeed: Double {
        appState.currentVehicle?.speed ?? 0
    }
    
    private var energyUsed: Double {
        100.0 - (appState.currentVehicle?.batteryLevel ?? 0)
    }
    
    private var chargingStops: Int {
        appState.currentRoute?.chargingStops.count ?? 0
    }
    
    private var distanceData: [Double] {
        [0.4, 0.6, 0.8, 0.3, 0.7, 0.5, 0.9]
    }
    
    private var energyData: [Double] {
        [0.3, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5]
    }
    
    private var speedData: [Double] {
        [0.6, 0.4, 0.7, 0.5, 0.8, 0.6, 0.3]
    }
}
