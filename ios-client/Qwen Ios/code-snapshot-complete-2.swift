 name: "48ContinentalUSA",
 platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(name: "48ContinentalUSA", targets: ["48ContinentalUSA"])
    ],
    dependencies: [
        .package(url: "https://github.com/mapbox/mapbox-maps-ios.git", from: "10.15.0"),
        .package(url: "https://github.com/mrackwitz/KeychainAccess.git", from: "4.2.2")
    ],
    targets: [
        .target(
            name: "48ContinentalUSA",
            dependencies: [
                .product(name: "MapboxMaps", package: "mapbox-maps-ios"),
                "KeychainAccess"
            ],
            path: "Sources",
            sources: [
                "Models", "Networking", "ViewModels", "Views", "Services", "Utils"
            ],
            resources: [
                .process("Resources")
            ]
        )
    ]
)