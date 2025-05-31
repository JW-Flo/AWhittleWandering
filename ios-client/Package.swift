// swift-tools-version:5.9
import PackageDescription

let package = Package(
  name: "MCPClient",
  platforms: [.iOS(.v17)],
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
      path: "Sources",
      plugins: [
        .plugin(name: "OpenAPIGeneratorPlugin", package: "swift-openapi-generator")
      ]
    )
  ]
)
