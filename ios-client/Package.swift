// swift-tools-version:5.9
import PackageDescription

let package = Package(
  name: "MCPClient",
  // Added macOS platform support for OpenAPI generator plugin (requires macOS 10.15+)
  platforms: [
    .iOS(.v17),
    .macOS(.v10_15),
    .watchOS(.v9)
  ],
  products: [.library(name: "MCPClient", targets: ["MCPClient"])],
  dependencies: [
    .package(
      url: "https://github.com/apple/swift-openapi-generator.git",
      branch: "main"
    ),
    .package(
      url: "https://github.com/teslamotors/tesla-api.git",
      from: "1.0.0"
    ),
    .package(
      url: "https://github.com/realm/realm-swift.git",
      from: "10.0.0"
    )
  ],
  targets: [
    .target(
        name: "MCPClient",
        dependencies: [],
        path: "Sources"
    ),
    .testTarget(
        name: "TeslaAPITests",
        dependencies: ["MCPClient", "TeslaAPI"],
        path: "Tests"
    )
  ]
)
