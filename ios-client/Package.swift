// swift-tools-version:5.9
import PackageDescription
let package = Package(
  name: "MCPClient",
  platforms: [.iOS(.v17)],
  products: [.library(name: "MCPClient", targets: ["MCPClient"])],
  targets: [.target(name: "MCPClient", path: "Sources")]
)
