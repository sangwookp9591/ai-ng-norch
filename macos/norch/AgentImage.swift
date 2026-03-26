import SwiftUI
import AppKit

/// Loads agent SVG from the app bundle's Resources directory
struct AgentImage: View {
    let id: String

    var body: some View {
        if let nsImage = loadSVG() {
            Image(nsImage: nsImage)
                .resizable()
                .interpolation(.none)
        } else {
            // Fallback: colored rounded square with initial
            let agent = AgentInfo.all.first { $0.id == id }
            ZStack {
                RoundedRectangle(cornerRadius: 6)
                    .fill(agent?.color.opacity(0.6) ?? Color.gray.opacity(0.4))
                Text(String(id.prefix(1)).uppercased())
                    .font(.system(size: 12, weight: .heavy, design: .rounded))
                    .foregroundColor(.white)
            }
        }
    }

    private func loadSVG() -> NSImage? {
        guard let url = Bundle.main.url(forResource: id, withExtension: "svg") else {
            return nil
        }
        return NSImage(contentsOf: url)
    }
}
