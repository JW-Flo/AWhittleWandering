import SwiftUI

@main
struct ContinentalUSAApp: App {
    // App state as a shared environment object
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            NavigationView {
                MapViewController()
                    .environmentObject(appState)
            }
            .navigationViewStyle(StackNavigationViewStyle())
            .onAppear {
                // Set up any additional configuration here
                print("48 Continental USA app started")
                
                // Register for background tasks if needed
                registerBackgroundTasks()
            }
        }
    }
    
    /// Register for background tasks to keep the app updated when in background
    private func registerBackgroundTasks() {
        // This would be implemented with actual background task registration
        // For the iOS app to maintain connectivity with vehicle tracking
        print("Background tasks registered")
    }
}
