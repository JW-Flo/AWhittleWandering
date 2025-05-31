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
    )
  ],
  targets: [
    .target(
        name: "MCPClient",
        dependencies: [],
        path: "Sources"
    )
  ]
)
