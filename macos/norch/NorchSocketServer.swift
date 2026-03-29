import Foundation

/// WebSocket client that receives events from the bundled norch relay server.
/// (Previously a Unix socket server — now the Node.js process owns /tmp/norch.sock.)
final class NorchSocketServer {
    static let shared = NorchSocketServer()

    private var wsTask: URLSessionWebSocketTask?
    private var isRunning = false
    private let wsURL = URL(string: "ws://localhost:4819")!

    func start() {
        isRunning = true
        connect()
    }

    func stop() {
        isRunning = false
        wsTask?.cancel(with: .goingAway, reason: nil)
        wsTask = nil
    }

    // MARK: - Private

    private func connect() {
        guard isRunning else { return }

        wsTask?.cancel(with: .goingAway, reason: nil)
        wsTask = URLSession.shared.webSocketTask(with: wsURL)
        wsTask?.resume()
        receiveNext()
    }

    private func receiveNext() {
        wsTask?.receive { [weak self] result in
            guard let self, self.isRunning else { return }

            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self.handleMessage(text)
                    }
                @unknown default:
                    break
                }
                self.receiveNext()

            case .failure:
                // Reconnect after a delay
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
                    self?.connect()
                }
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }

        DispatchQueue.main.async {
            NorchState.shared.handleEvent(json)
        }
    }
}
