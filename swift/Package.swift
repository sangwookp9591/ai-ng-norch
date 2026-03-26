// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "norch",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(
            name: "norch",
            path: "norch"
        )
    ]
)
