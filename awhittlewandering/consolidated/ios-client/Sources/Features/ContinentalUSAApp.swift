import SwiftUI
import MapboxMaps

@main
struct ContinentalUSAApp: App {
    @StateObject private var appState = AppState()
    
    init() {
        // Configure MapBox
        ResourceOptionsManager.default.resourceOptions.accessToken = "YOUR_MAPBOX_ACCESS_TOKEN"
        
        // Register for background tasks
        registerBackgroundTasks()
        
        // Setup offline support
        setupOfflineSupport()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .preferredColorScheme(.dark) // Force dark mode for better visibility
                .onAppear {
                    // Start monitoring network status
                    NetworkManager.shared.setupMonitoring()
                }
        }
    }
    
    // MARK: - Background Tasks
    
    private func registerBackgroundTasks() {
        // Register background tasks for location updates
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.continentalusa.locationUpdate",
            using: nil
        ) { task in
            handleLocationUpdateTask(task as! BGProcessingTask)
        }
        
        // Register background tasks for data sync
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.continentalusa.dataSync",
            using: nil
        ) { task in
            handleDataSyncTask(task as! BGProcessingTask)
        }
    }
    
    private func handleLocationUpdateTask(_ task: BGProcessingTask) {
        // Schedule next update
        scheduleLocationUpdate()
        
        // Update location in background
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }
        
        // Perform location update
        Task {
            do {
                try await appState.updateVehicleStatus()
                task.setTaskCompleted(success: true)
            } catch {
                task.setTaskCompleted(success: false)
            }
        }
    }
    
    private func handleDataSyncTask(_ task: BGProcessingTask) {
        // Schedule next sync
        scheduleDataSync()
        
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }
        
        // Perform data sync
        Task {
            do {
                if NetworkManager.shared.isConnected {
                    try await syncOfflineData()
                }
                task.setTaskCompleted(success: true)
            } catch {
                task.setTaskCompleted(success: false)
            }
        }
    }
    
    private func scheduleLocationUpdate() {
        let request = BGProcessingTaskRequest(identifier: "com.continentalusa.locationUpdate")
        request.requiresNetworkConnectivity = false
        request.requiresExternalPower = false
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        try? BGTaskScheduler.shared.submit(request)
    }
    
    private func scheduleDataSync() {
        let request = BGProcessingTaskRequest(identifier: "com.continentalusa.dataSync")
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        request.earliestBeginDate = Date(timeIntervalSinceNow: 30 * 60) // 30 minutes
        
        try? BGTaskScheduler.shared.submit(request)
    }
    
    // MARK: - Offline Support
    
    private func setupOfflineSupport() {
        // Initialize offline manager
        _ = OfflineManager.shared
        
        // Setup notification observers for connectivity changes
        NotificationCenter.default.addObserver(
            forName: .networkStatusChanged,
            object: nil,
            queue: .main
        ) { notification in
            guard let isConnected = notification.userInfo?["isConnected"] as? Bool else { return }
            handleConnectivityChange(isConnected: isConnected)
        }
    }
    
    private func handleConnectivityChange(isConnected: Bool) {
        if isConnected {
            // Attempt to sync offline data
            Task {
                try? await syncOfflineData()
            }
        } else {
            // Enable offline mode
            appState.enableOfflineMode()
        }
    }
    
    private func syncOfflineData() async throws {
        // Sync cached data with server
        // Implementation will be added when we create SyncManager
    }
}

// MARK: - Content View

struct ContentView: View {
    @EnvironmentObject private var appState: AppState
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            MapView()
                .tabItem {
                    Label("Navigation", systemImage: "map")
                }
                .tag(0)
            
            TripStatsView()
                .tabItem {
                    Label("Stats", systemImage: "chart.bar")
                }
                .tag(1)
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(2)
        }
        .overlay(offlineBanner)
    }
    
    @ViewBuilder
    private var offlineBanner: some View {
        if appState.isOfflineMode {
            VStack {
                HStack {
                    Image(systemName: "wifi.slash")
                    Text("Offline Mode")
                }
                .font(.caption)
                .padding(8)
                .background(Color(.systemBackground))
                .cornerRadius(8)
                .shadow(radius: 2)
                
                Spacer()
            }
            .padding(.top, 4)
        }
    }
}

// MARK: - Placeholder Views

struct TripStatsView: View {
    var body: some View {
        Text("Trip Statistics")
            .font(.title)
    }
}

struct SettingsView: View {
    var body: some View {
        Text("Settings")
            .font(.title)
    }
}
