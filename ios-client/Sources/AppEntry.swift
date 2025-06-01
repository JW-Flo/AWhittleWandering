import SwiftUI

// Import all views from the same module
@main
struct ContinentalApp: App {
    var body: some Scene {
        WindowGroup {
            TabView {
                DashboardView()
                    .tabItem {
                        Label("Dashboard", systemImage: "speedometer")
                    }

                MapView()
                    .tabItem {
                        Label("Map", systemImage: "map")
                    }

                PeopleTabView()
                    .tabItem {
                        Label("People", systemImage: "person.3")
                    }

                SettingsManagerView()
                    .tabItem {
                        Label("Settings", systemImage: "gear")
                    }
            }
        }
    }
}
