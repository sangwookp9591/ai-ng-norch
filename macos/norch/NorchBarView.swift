import SwiftUI

struct NorchBarView: View {
    @StateObject private var state = NorchState.shared
    @State private var hovered = false

    private let notchGap: CGFloat = 170

    private var activeAgents: [AgentInfo] {
        AgentInfo.all.filter { state.state(for: $0.id) == .working }
    }

    var body: some View {
        GeometryReader { geo in
            HStack(spacing: 0) {
                Spacer()

                HStack(spacing: 0) {
                    let active = activeAgents
                    if !active.isEmpty {
                        let mid = active.count / 2
                        let left = Array(active.prefix(max(mid, 1)))
                        let right = Array(active.suffix(from: max(mid, 1)))

                        agentGroup(left)
                            .padding(.horizontal, 8)

                        Spacer().frame(width: notchGap)

                        agentGroup(right)
                            .padding(.horizontal, 8)
                    }
                }
                .frame(maxHeight: .infinity)
                .background(
                    RoundedCorners(tl: 0, tr: 0, bl: 10, br: 10)
                        .fill(Color.black)
                )
                .onTapGesture {
                    NotificationCenter.default.post(name: .norchToggleExpand, object: nil)
                }

                Spacer()
            }
        }
        .onHover { hovered = $0 }
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: hovered)
        .animation(.easeInOut(duration: 0.25), value: activeAgents.map(\.id))
    }

    @ViewBuilder
    func agentGroup(_ agents: [AgentInfo]) -> some View {
        HStack(spacing: 3) {
            ForEach(agents) { a in
                sprite(a)
            }
        }
    }

    @ViewBuilder
    func sprite(_ agent: AgentInfo) -> some View {
        VStack(spacing: 1) {
            Circle()
                .fill(agent.color)
                .frame(width: 4, height: 4)
                .shadow(color: agent.color, radius: 3)
            AgentImage(id: agent.id)
                .frame(width: 26, height: 26)
                .offset(y: -2)
        }
        .transition(.scale.combined(with: .opacity))
    }
}

struct RoundedCorners: Shape {
    var tl: CGFloat = 0
    var tr: CGFloat = 0
    var bl: CGFloat = 0
    var br: CGFloat = 0

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let w = rect.size.width, h = rect.size.height
        path.move(to: CGPoint(x: tl, y: 0))
        path.addLine(to: CGPoint(x: w - tr, y: 0))
        path.addArc(tangent1End: CGPoint(x: w, y: 0), tangent2End: CGPoint(x: w, y: tr), radius: tr)
        path.addLine(to: CGPoint(x: w, y: h - br))
        path.addArc(tangent1End: CGPoint(x: w, y: h), tangent2End: CGPoint(x: w - br, y: h), radius: br)
        path.addLine(to: CGPoint(x: bl, y: h))
        path.addArc(tangent1End: CGPoint(x: 0, y: h), tangent2End: CGPoint(x: 0, y: h - bl), radius: bl)
        path.addLine(to: CGPoint(x: 0, y: tl))
        path.addArc(tangent1End: CGPoint(x: 0, y: 0), tangent2End: CGPoint(x: tl, y: 0), radius: tl)
        return path
    }
}

// Notification name for expand toggle
extension Notification.Name {
    static let norchToggleExpand = Notification.Name("norchToggleExpand")
    static let norchCollapse = Notification.Name("norchCollapse")
}
