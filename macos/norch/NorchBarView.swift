import SwiftUI

struct NorchBarView: View {
    @StateObject private var state = NorchState.shared
    @State private var hovered = false

    private let notchGap: CGFloat = 170

    var body: some View {
        GeometryReader { geo in
            HStack(spacing: 0) {
                Spacer()

                HStack(spacing: 0) {
                    agentGroup(AgentInfo.leftRow)
                        .padding(.horizontal, 8)

                    Spacer().frame(width: notchGap)

                    agentGroup(AgentInfo.rightRow)
                        .padding(.horizontal, 8)
                }
                .frame(maxHeight: .infinity)
                .background(
                    RoundedCorners(tl: 0, tr: 0, bl: 10, br: 10)
                        .fill(Color.black)
                )
                .onTapGesture {
                    // 클릭 시 확장 패널 열기
                    NotificationCenter.default.post(name: .norchToggleExpand, object: nil)
                }

                Spacer()
            }
        }
        .onHover { hovered = $0 }
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: hovered)
    }

    @ViewBuilder
    func agentGroup(_ agents: [AgentInfo]) -> some View {
        HStack(spacing: hovered ? 3 : -4) {
            if hovered {
                ForEach(agents) { a in
                    sprite(a)
                }
            } else {
                let sentinel = agents.first { state.state(for: $0.id) == .working } ?? agents.first!
                sprite(sentinel)
            }
        }
    }

    @ViewBuilder
    func sprite(_ agent: AgentInfo) -> some View {
        let isWorking = state.state(for: agent.id) == .working

        VStack(spacing: 1) {
            if isWorking {
                Circle()
                    .fill(agent.color)
                    .frame(width: 4, height: 4)
                    .shadow(color: agent.color, radius: 3)
            }
            AgentImage(id: agent.id)
                .frame(width: 26, height: 26)
                .opacity(isWorking ? 1 : (state.sessionActive ? 0.7 : 0.4))
                .saturation(isWorking ? 1 : 0.5)
                .offset(y: isWorking ? -2 : 0)
        }
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
