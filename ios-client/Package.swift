// swift-tools-version:5.9
import PackageDescription

let package = Package(
  name: "MCPClient",
  platforms: [
    .iOS(.v17),
    .macOS(.v13),
  ],
  products: [.library(name: "MCPClient", targets: ["MCPClient"])],
  dependencies: [
    .package(
      url: "https://github.com/apple/swift-openapi-runtime.git",
      from: "1.0.0"
    ),
    .package(
      url: "https://github.com/realm/realm-swift.git",
      from: "10.0.0"
    ),
  ],
  targets: [
    .target(
      name: "MCPClient",
      dependencies: [
        .product(name: "OpenAPIRuntime", package: "swift-openapi-runtime"),
        .product(name: "RealmSwift", package: "realm-swift"),
      ],
      path: "Sources"
    ),
    .testTarget(
      name: "TeslaAPITests",
      dependencies: ["MCPClient"],
      path: "Tests"
    ),
  ]
)
