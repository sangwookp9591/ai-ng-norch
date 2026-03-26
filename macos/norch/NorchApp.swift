import SwiftUI

@main
struct NorchApp: App {
    @NSApplicationDelegateAdaptor(NorchAppDelegate.self) var appDelegate
    var body: some Scene {
        Settings { EmptyView() }
    }
}
