import SwiftUI

struct AgentInfo: Identifiable {
    let id: String
    let name: String
    let role: String
    let color: Color

    static let all: [AgentInfo] = [
        AgentInfo(id: "sam", name: "Sam", role: "CTO", color: Color(hex: 0xa78bfa)),
        AgentInfo(id: "simon", name: "Simon", role: "CEO", color: Color(hex: 0x94a3b8)),
        AgentInfo(id: "able", name: "Able", role: "기획", color: Color(hex: 0x60a5fa)),
        AgentInfo(id: "klay", name: "Klay", role: "설계", color: Color(hex: 0x5eead4)),
        AgentInfo(id: "ryan", name: "Ryan", role: "원칙", color: Color(hex: 0x84cc16)),
        AgentInfo(id: "noa", name: "Noa", role: "검증", color: Color(hex: 0x14b8a6)),
        AgentInfo(id: "critic", name: "Critic", role: "비평", color: Color(hex: 0xef4444)),
        AgentInfo(id: "jay", name: "Jay", role: "API", color: Color(hex: 0xfb923c)),
        AgentInfo(id: "jerry", name: "Jerry", role: "DB", color: Color(hex: 0xfbbf24)),
        AgentInfo(id: "milla", name: "Milla", role: "보안", color: Color(hex: 0x4ade80)),
        AgentInfo(id: "jun", name: "Jun", role: "성능", color: Color(hex: 0xf97316)),
        AgentInfo(id: "kain", name: "Kain", role: "분석", color: Color(hex: 0x64748b)),
        AgentInfo(id: "willji", name: "Willji", role: "디자인", color: Color(hex: 0xf9a8d4)),
        AgentInfo(id: "iron", name: "Iron", role: "화면", color: Color(hex: 0xd946ef)),
        AgentInfo(id: "rowan", name: "Rowan", role: "모션", color: Color(hex: 0xa3e635)),
        AgentInfo(id: "derek", name: "Derek", role: "모바일", color: Color(hex: 0x22d3ee)),
        AgentInfo(id: "progress", name: "Progress", role: "진행도", color: Color(hex: 0x06b6d4)),
    ]

    // Menu bar layout: split around notch
    static let leftRow = Array(all.prefix(9))
    static let rightRow = Array(all.suffix(8))
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
