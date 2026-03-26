import SwiftUI
import Combine

@MainActor
final class NorchState: ObservableObject {
    static let shared = NorchState()

    @Published var agentStates: [String: AgentState] = [:]
    @Published var sessionActive = false
    @Published var isExpanded = false
    @Published var hoveredAgent: String?

    func state(for id: String) -> AgentState {
        agentStates[id] ?? .idle
    }

    var workingCount: Int {
        agentStates.values.filter { $0 == .working }.count
    }

    func handleEvent(_ event: [String: Any]) {
        guard let type = event["type"] as? String else { return }

        if type == "session-start" { sessionActive = true }
        if type == "session-end" { sessionActive = false; agentStates.removeAll() }

        if let agentDict = event["agent"] as? [String: Any],
           let name = agentDict["name"] as? String {
            let id = name.lowercased()
            switch type {
            case "agent-spawn", "agent-working", "tool-use":
                agentStates[id] = .working
            case "agent-idle", "agent-done":
                agentStates[id] = .idle
            case "error":
                agentStates[id] = .error
            default: break
            }
        }
    }
}
