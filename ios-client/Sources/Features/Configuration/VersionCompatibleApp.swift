import SwiftUI
import MapboxMaps
import BackgroundTasks

@main
struct ContinentalUSAApp: App {
    @StateObject private var appState = AppState()
    
    init() {
        // Configure version-specific features
        APICompatibility.configureMapBox()
        APICompatibility.configureLocationServices()
        
        // Register for background tasks with version-specific handling
        registerBackgroundTasks()
        
        // Setup offline support with version-specific optimizations
        setupOfflineSupport()
        
        // Configure minimum supported version
        checkVersionCompatibility()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .preferredColorScheme(.dark)
                .versionCompatible()
                .onAppear {
                    // Start monitoring network status
                    NetworkManager.shared.setupMonitoring()
                }
        }
    }
    
    // MARK: - Version Compatibility
    
    private func checkVersionCompatibility() {
        switch iOSVersion.current {
        case .iOS18, .iOS17, .iOS16, .iOS15:
            // Supported versions
            break
        case .unsupported:
            // Show alert for unsupported version
            fatalError("Unsupported iOS version. Please upgrade to iOS 15 or later.")
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
        
        // iOS 18 specific background tasks
        if #available(iOS 18.0, *) {
            registerEnhancedBackgroundTasks()
        }
    }
    
    private func handleLocationUpdateTask(_ task: BGProcessingTask) {
        // Schedule next update with version-specific interval
        scheduleLocationUpdate()
        
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }
        
        // Perform location update with version-specific accuracy
        Task {
            do {
                if #available(iOS 18.0, *) {
                    try await appState.updateVehicleStatusEnhanced()
                } else {
                    try await appState.updateVehicleStatus()
                }
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
        
        // Perform data sync with version-specific optimizations
        Task {
            do {
                if NetworkManager.shared.isConnected {
                    if #available(iOS 18.0, *) {
                        try await syncOfflineDataEnhanced()
                    } else {
                        try await syncOfflineData()
                    }
                }
                task.setTaskCompleted(success: true)
            } catch {
                task.setTaskCompleted(success: false)
            }
        }
    }
    
    @available(iOS 18.0, *)
    private func registerEnhancedBackgroundTasks() {
        // Register iOS 18 specific background tasks
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.continentalusa.enhancedSync",
            using: nil
        ) { task in
            // Handle enhanced sync capabilities
            handleEnhancedSyncTask(task as! BGProcessingTask)
        }
    }
    
    @available(iOS 18.0, *)
    private func handleEnhancedSyncTask(_ task: BGProcessingTask) {
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }
        
        Task {
            do {
                // Perform enhanced sync operations
                try await performEnhancedSync()
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
        
        // Version-specific scheduling
        if #available(iOS 18.0, *) {
            request.earliestBeginDate = Date(timeIntervalSinceNow: 5 * 60) // 5 minutes for enhanced accuracy
        } else {
            request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes for standard accuracy
        }
        
        try? BGTaskScheduler.shared.submit(request)
    }
    
    private func scheduleDataSync() {
        let request = BGProcessingTaskRequest(identifier: "com.continentalusa.dataSync")
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        
        // Version-specific sync intervals
        if #available(iOS 18.0, *) {
            request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes for enhanced sync
        } else {
            request.earliestBeginDate = Date(timeIntervalSinceNow: 30 * 60) // 30 minutes for standard sync
        }
        
        try? BGTaskScheduler.shared.submit(request)
    }
    
    // MARK: - Offline Support
    
    private func setupOfflineSupport() {
        // Initialize offline manager with version-specific features
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
            // Attempt to sync offline data with version-specific optimizations
            Task {
                if #available(iOS 18.0, *) {
                    try? await syncOfflineDataEnhanced()
                } else {
                    try? await syncOfflineData()
                }
            }
        } else {
            // Enable offline mode with version-specific features
            appState.enableOfflineMode()
        }
    }
    
    private func syncOfflineData() async throws {
        // Standard sync implementation
        try await OfflineManager.shared.syncData()
    }
    
    @available(iOS 18.0, *)
    private func syncOfflineDataEnhanced() async throws {
        // Enhanced sync with iOS 18 optimizations
        try await OfflineManager.shared.syncDataEnhanced()
    }
    
    @available(iOS 18.0, *)
    private func performEnhancedSync() async throws {
        // Implement iOS 18 specific sync optimizations
        try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
    }
}
