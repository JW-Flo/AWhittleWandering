import SwiftUI

public struct RouteDetailsSheet: View {
    let route: DisplayRoute?
    @Binding var isVisible: Bool
    let onStartNavigation: () -> Void
    
    @State private var sheetOffset: CGFloat = 0
    @State private var selectedTab = 0
    
    private let tabs = ["Overview", "Charging", "States"]
    
    public var body: some View {
        VStack(spacing: 0) {
            // Handle
            handleBar
            
            // Tab Bar
            tabBar
            
            // Content
            TabView(selection: $selectedTab) {
                overviewTab
                    .tag(0)
                
                chargingTab
                    .tag(1)
                
                statesTab
                    .tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            
            // Start Navigation Button
            startButton
        }
        .background(Color(.systemBackground))
        .cornerRadius(12, corners: [.topLeft, .topRight])
        .shadow(radius: 5)
        .gesture(
            DragGesture()
                .onChanged { value in
                    let translation = value.translation.height
                    sheetOffset = translation > 0 ? translation : 0
                }
                .onEnded { value in
                    if value.translation.height > 100 {
                        withAnimation {
                            isVisible = false
                        }
                    } else {
                        withAnimation {
                            sheetOffset = 0
                        }
                    }
                }
        )
        .offset(y: sheetOffset)
    }
    
    // MARK: - Components
    
    private var handleBar: some View {
        RoundedRectangle(cornerRadius: 2.5)
            .fill(Color(.systemGray3))
            .frame(width: 40, height: 5)
            .padding(.vertical, 8)
    }
    
    private var tabBar: some View {
        HStack {
            ForEach(0..<tabs.count, id: \.self) { index in
                Button(action: {
                    withAnimation {
                        selectedTab = index
                    }
                }) {
                    Text(tabs[index])
                        .font(.subheadline)
                        .fontWeight(selectedTab == index ? .bold : .regular)
                        .foregroundColor(selectedTab == index ? .primary : .secondary)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
    
    // MARK: - Tab Contents
    
    private var overviewTab: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Trip Progress
                tripProgressSection
                
                Divider()
                
                // Time & Distance
                timeAndDistanceSection
                
                Divider()
                
                // Weather Risk
                weatherRiskSection
            }
            .padding()
        }
    }
    
    private var chargingTab: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ForEach(route?.chargingStops ?? [], id: \.id) { station in
                    ChargingStationRow(station: station)
                }
            }
            .padding()
        }
    }
    
    private var statesTab: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ForEach(route?.statesCrossed ?? [], id: \.self) { state in
                    StateRow(
                        state: state,
                        isVisited: route?.statesVisited?.contains(state) ?? false
                    )
                }
            }
            .padding()
        }
    }
    
    // MARK: - Section Components
    
    private var tripProgressSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Trip Progress")
                .font(.headline)
            
            HStack {
                CircularProgressView(
                    progress: Double(route?.statesVisited?.count ?? 0) / 48.0,
                    color: .blue
                )
                .frame(width: 60, height: 60)
                
                VStack(alignment: .leading) {
                    Text("\(route?.statesVisited?.count ?? 0)/48 States")
                        .font(.title3)
                        .fontWeight(.semibold)
                    Text("States Visited")
                        .foregroundColor(.secondary)
                }
            }
        }
    }
    
    private var timeAndDistanceSection: some View {
        HStack {
            VStack(alignment: .leading) {
                Label(
                    formatDuration(route?.totalDuration ?? 0),
                    systemImage: "clock"
                )
                .font(.subheadline)
                
                Text("Total Time")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Label(
                    String(format: "%.0f mi", route?.totalDistance ?? 0),
                    systemImage: "map"
                )
                .font(.subheadline)
                
                Text("Total Distance")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    private var weatherRiskSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Weather Risk")
                .font(.headline)
            
            HStack {
                weatherRiskIndicator
                
                Text(weatherRiskDescription)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    private var weatherRiskIndicator: some View {
        let risk = route?.weatherRisk ?? 0
        return Circle()
            .fill(weatherRiskColor(risk))
            .frame(width: 12, height: 12)
    }
    
    private var startButton: some View {
        Button(action: onStartNavigation) {
            Text("Start Navigation")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .cornerRadius(12)
        }
        .padding()
    }
    
    // MARK: - Helper Views
    
    private struct ChargingStationRow: View {
        let station: ChargingStation
        
        var body: some View {
            HStack {
                VStack(alignment: .leading) {
                    Text(station.name)
                        .font(.headline)
                    Text("\(Int(station.powerKw)) kW")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                StatusIndicator(isAvailable: station.available)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(8)
        }
    }
    
    private struct StateRow: View {
        let state: String
        let isVisited: Bool
        
        var body: some View {
            HStack {
                Text(state)
                    .font(.headline)
                
                Spacer()
                
                Image(systemName: isVisited ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isVisited ? .green : .secondary)
            }
        }
    }
    
    private struct StatusIndicator: View {
        let isAvailable: Bool
        
        var body: some View {
            HStack {
                Circle()
                    .fill(isAvailable ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
                
                Text(isAvailable ? "Available" : "Occupied")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    private struct CircularProgressView: View {
        let progress: Double
        let color: Color
        
        var body: some View {
            ZStack {
                Circle()
                    .stroke(color.opacity(0.2), lineWidth: 8)
                
                Circle()
                    .trim(from: 0, to: CGFloat(min(progress, 1.0)))
                    .stroke(color, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.linear, value: progress)
            }
        }
    }
    
    // MARK: - Helper Functions
    
    private func formatDuration(_ seconds: TimeInterval) -> String {
        let hours = Int(seconds) / 3600
        let minutes = Int(seconds) / 60 % 60
        return "\(hours)h \(minutes)m"
    }
    
    private func weatherRiskColor(_ risk: Double) -> Color {
        switch risk {
        case 0...0.3: return .green
        case 0.3...0.7: return .yellow
        default: return .red
        }
    }
    
    private var weatherRiskDescription: String {
        let risk = route?.weatherRisk ?? 0
        switch risk {
        case 0...0.3: return "Low Risk"
        case 0.3...0.7: return "Moderate Risk"
        default: return "High Risk"
        }
    }
}

// MARK: - Corner Radius Extension

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners
    
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}
