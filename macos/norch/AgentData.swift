import SwiftUI

struct AgentInfo: Identifiable {
    let id: String
    let name: String
    let role: String
    let color: Color

    static let all: [AgentInfo] = [
        AgentInfo(id: "sam", name: "Sam", role: "CTO", color: Color(hex: 0xa78bfa)),
        AgentInfo(id: "able", name: "Able", role: "기획", color: Color(hex: 0x60a5fa)),
        AgentInfo(id: "klay", name: "Klay", role: "설계", color: Color(hex: 0x5eead4)),
        AgentInfo(id: "jay", name: "Jay", role: "API", color: Color(hex: 0xfb923c)),
        AgentInfo(id: "jerry", name: "Jerry", role: "DB", color: Color(hex: 0xfbbf24)),
        AgentInfo(id: "milla", name: "Milla", role: "보안", color: Color(hex: 0x4ade80)),
        AgentInfo(id: "jun", name: "Jun", role: "성능", color: Color(hex: 0xf97316)),
        AgentInfo(id: "willji", name: "Willji", role: "디자인", color: Color(hex: 0xf9a8d4)),
        AgentInfo(id: "iron", name: "Iron", role: "화면", color: Color(hex: 0xd946ef)),
        AgentInfo(id: "rowan", name: "Rowan", role: "모션", color: Color(hex: 0xa3e635)),
        AgentInfo(id: "derek", name: "Derek", role: "모바일", color: Color(hex: 0x22d3ee)),
        AgentInfo(id: "simon", name: "Simon", role: "코드분석", color: Color(hex: 0x94a3b8)),
    ]

    static let leftRow = Array(all.prefix(6))
    static let rightRow = Array(all.suffix(6))
}

enum AgentState: String {
    case idle, working, waiting, error, done
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}
