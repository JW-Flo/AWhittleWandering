import SwiftUI

public struct SettingsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showingClearCacheAlert = false
    @State private var showingLogoutAlert = false
    @State private var offlineMapDownloadProgress: Double = 0
    
    // Settings state
    @AppStorage("useDarkMode") private var useDarkMode = true
    @AppStorage("useMetricSystem") private var useMetricSystem = false
    @AppStorage("voiceGuidanceEnabled") private var voiceGuidanceEnabled = true
    @AppStorage("batteryOptimizationEnabled") private var batteryOptimizationEnabled = true
    
    public var body: some View {
        NavigationView {
            List {
                // App Preferences
                Section(header: Text("Preferences")) {
                    Toggle("Dark Mode", isOn: $useDarkMode)
                    Toggle("Use Metric System", isOn: $useMetricSystem)
                    Toggle("Voice Guidance", isOn: $voiceGuidanceEnabled)
                    Toggle("Battery Optimization", isOn: $batteryOptimizationEnabled)
                }
                
                // Vehicle Settings
                Section(header: Text("Vehicle")) {
                    if let vehicle = appState.currentVehicle {
                        vehicleInfoRow(vehicle)
                    }
                    
                    NavigationLink(destination: Text("Vehicle Settings")) {
                        Label("Vehicle Settings", systemImage: "car")
                    }
                }
                
                // Offline Maps
                Section(header: Text("Offline Maps")) {
                    VStack(alignment: .leading) {
                        HStack {
                            Text("Downloaded Maps")
                            Spacer()
                            Text(formatStorageSize(getOfflineMapSize()))
                                .foregroundColor(.secondary)
                        }
                        
                        if offlineMapDownloadProgress > 0 {
                            ProgressView(value: offlineMapDownloadProgress)
                                .progressViewStyle(.linear)
                                .padding(.top, 4)
                        }
                    }
                    
                    Button(action: downloadOfflineMaps) {
                        Label("Update Offline Maps", systemImage: "arrow.down.circle")
                    }
                    
                    Button(action: { showingClearCacheAlert = true }) {
                        Label("Clear Cache", systemImage: "trash")
                            .foregroundColor(.red)
                    }
                }
                
                // Account
                Section(header: Text("Account")) {
                    NavigationLink(destination: Text("Account Settings")) {
                        Label("Account Settings", systemImage: "person.circle")
                    }
                    
                    Button(action: { showingLogoutAlert = true }) {
                        Label("Log Out", systemImage: "arrow.right.square")
                            .foregroundColor(.red)
                    }
                }
                
                // About
                Section(header: Text("About")) {
                    NavigationLink(destination: Text("Privacy Policy")) {
                        Label("Privacy Policy", systemImage: "hand.raised")
                    }
                    
                    NavigationLink(destination: Text("Terms of Service")) {
                        Label("Terms of Service", systemImage: "doc.text")
                    }
                    
                    HStack {
                        Label("Version", systemImage: "info.circle")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .alert("Clear Cache", isPresented: $showingClearCacheAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Clear", role: .destructive) {
                    clearCache()
                }
            } message: {
                Text("This will delete all offline maps and cached data. Are you sure?")
            }
            .alert("Log Out", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Log Out", role: .destructive) {
                    logout()
                }
            } message: {
                Text("Are you sure you want to log out?")
            }
        }
    }
    
    // MARK: - Helper Views
    
    private func vehicleInfoRow(_ vehicle: VehicleData) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Tesla Model 3")
                    .font(.headline)
                Spacer()
                Text(vehicle.vehicleId)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            HStack {
                Label("\(Int(vehicle.batteryLevel))%", systemImage: "battery.100")
                Spacer()
                Label("\(Int(vehicle.range)) mi", systemImage: "map")
            }
            .font(.subheadline)
            .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Actions
    
    private func downloadOfflineMaps() {
        // Simulate download progress
        withAnimation {
            offlineMapDownloadProgress = 0.1
        }
        
        // Update offline maps using OfflineManager
        Task {
            for progress in stride(from: 0.1, through: 1.0, by: 0.1) {
                try? await Task.sleep(nanoseconds: 500_000_000)
                withAnimation {
                    offlineMapDownloadProgress = progress
                }
            }
            
            // Reset progress after completion
            try? await Task.sleep(nanoseconds: 500_000_000)
            withAnimation {
                offlineMapDownloadProgress = 0
            }
        }
    }
    
    private func clearCache() {
        OfflineManager.shared.clearOutdatedCache()
    }
    
    private func logout() {
        // Implementation will be added when we create AuthManager
    }
    
    // MARK: - Helper Functions
    
    private func getOfflineMapSize() -> Int64 {
        // This would actually check the size of cached map data
        return 1024 * 1024 * 256 // 256 MB for example
    }
    
    private func formatStorageSize(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
}

// MARK: - Preview

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
            .environmentObject(AppState.preview)
    }
}
