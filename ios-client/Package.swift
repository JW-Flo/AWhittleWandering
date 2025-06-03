// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "48Continental",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "48Continental",
            targets: ["48Continental"]
        )
    ],
    dependencies: [
        // Mapping & Navigation
        .package(url: "https://github.com/mapbox/mapbox-maps-ios.git", from: "10.16.1"),
        .package(url: "https://github.com/mapbox/mapbox-navigation-ios.git", from: "2.14.0"),
        
        // Tesla Integration
        .package(url: "https://github.com/jonasman/TeslaSwift.git", from: "8.0.2"),
        
        // Networking & Data
        .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.1"),
        .package(url: "https://github.com/realm/realm-swift.git", from: "10.45.2"),
        .package(url: "https://github.com/apollographql/apollo-ios.git", from: "1.7.1"),
        
        // UI Components
        .package(url: "https://github.com/SnapKit/SnapKit.git", from: "5.6.0"),
        .package(url: "https://github.com/onevcat/Kingfisher.git", from: "7.10.1"),
        .package(url: "https://github.com/danielgindi/Charts.git", from: "5.0.0"),
        .package(url: "https://github.com/HeroTransitions/Hero.git", from: "1.6.2"),
        
        // Analytics & Monitoring
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", from: "10.19.0"),
        .package(url: "https://github.com/amplitude/Amplitude-iOS.git", from: "8.17.1"),
        .package(url: "https://github.com/bugsnag/bugsnag-cocoa.git", from: "6.27.1"),
        
        // Performance & Optimization
        .package(url: "https://github.com/airbnb/lottie-ios.git", from: "4.3.3"),
        .package(url: "https://github.com/SDWebImage/SDWebImage.git", from: "5.18.7"),
        .package(url: "https://github.com/pointfreeco/swift-composable-architecture", from: "1.5.5"),
        
        // Security
        .package(url: "https://github.com/krzyzanowskim/CryptoSwift.git", from: "1.8.0"),
        .package(url: "https://github.com/auth0/Auth0.swift.git", from: "2.5.0"),
        .package(url: "https://github.com/kishikawakatsumi/KeychainAccess.git", from: "4.2.2")
    ],
    targets: [
        .target(
            name: "48Continental",
            dependencies: [
                // Mapping & Navigation
                .product(name: "MapboxMaps", package: "mapbox-maps-ios"),
                .product(name: "MapboxNavigation", package: "mapbox-navigation-ios"),
                
                // Tesla Integration
                .product(name: "TeslaSwift", package: "TeslaSwift"),
                
                // Networking & Data
                .product(name: "Alamofire", package: "Alamofire"),
                .product(name: "RealmSwift", package: "realm-swift"),
                .product(name: "Apollo", package: "apollo-ios"),
                
                // UI Components
                .product(name: "SnapKit", package: "SnapKit"),
                .product(name: "Kingfisher", package: "Kingfisher"),
                .product(name: "Charts", package: "Charts"),
                .product(name: "Hero", package: "Hero"),
                
                // Analytics & Monitoring
                .product(name: "FirebaseAnalytics", package: "firebase-ios-sdk"),
                .product(name: "FirebaseCrashlytics", package: "firebase-ios-sdk"),
                .product(name: "FirebasePerformance", package: "firebase-ios-sdk"),
                .product(name: "Amplitude", package: "Amplitude-iOS"),
                .product(name: "Bugsnag", package: "bugsnag-cocoa"),
                
                // Performance & Optimization
                .product(name: "Lottie", package: "lottie-ios"),
                .product(name: "SDWebImage", package: "SDWebImage"),
                .product(name: "ComposableArchitecture", package: "swift-composable-architecture"),
                
                // Security
                .product(name: "CryptoSwift", package: "CryptoSwift"),
                .product(name: "Auth0", package: "Auth0.swift"),
                .product(name: "KeychainAccess", package: "KeychainAccess")
            ],
            resources: [
                .process("Resources")
            ]
        ),
        .testTarget(
            name: "48ContinentalTests",
            dependencies: ["48Continental"]
        )
    ]
)
