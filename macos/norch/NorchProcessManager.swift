import Foundation

/// Manages the bundled Node.js server process (Next.js + WebSocket relay).
final class NorchProcessManager {
    static let shared = NorchProcessManager()

    private var serverProcess: Process?
    private let nextPort = 3819

    /// Start the bundled server. No-op if already running or port is occupied.
    func start() {
        guard serverProcess == nil || serverProcess?.isRunning != true else { return }

        // Skip if something is already serving on the port
        if isPortInUse(nextPort) {
            NSLog("[norch] port \(nextPort) already in use — skipping server launch")
            return
        }

        guard let nodePath = findNode() else {
            NSLog("[norch] node binary not found — cannot start server")
            return
        }

        guard let serverDir = Bundle.main.resourcePath.map({ $0 + "/server" }),
              FileManager.default.fileExists(atPath: serverDir + "/launch.mjs") else {
            NSLog("[norch] launch.mjs not found in app bundle")
            return
        }

        let process = Process()
        process.executableURL = URL(fileURLWithPath: nodePath)
        process.arguments = [serverDir + "/launch.mjs"]
        process.currentDirectoryURL = URL(fileURLWithPath: serverDir)

        var env = ProcessInfo.processInfo.environment
        env["PORT"] = "\(nextPort)"
        env["HOSTNAME"] = "localhost"
        process.environment = env

        // Log server output for debugging
        let logPath = "/tmp/norch-server.log"
        FileManager.default.createFile(atPath: logPath, contents: nil)
        let logHandle = FileHandle(forWritingAtPath: logPath)
        process.standardOutput = logHandle ?? FileHandle.nullDevice
        process.standardError = logHandle ?? FileHandle.nullDevice

        process.terminationHandler = { [weak self] p in
            if p.terminationReason == .uncaughtSignal {
                NSLog("[norch] server crashed (signal \(p.terminationStatus))")
            }
            DispatchQueue.main.async { self?.serverProcess = nil }
        }

        do {
            try process.run()
            serverProcess = process
            NSLog("[norch] server started (pid: \(process.processIdentifier))")
        } catch {
            NSLog("[norch] failed to start server: \(error)")
        }
    }

    /// Terminate the server process.
    func stop() {
        guard let process = serverProcess, process.isRunning else { return }
        process.terminate()
        serverProcess = nil
        NSLog("[norch] server stopped")
    }

    /// Poll until localhost:PORT responds (or timeout).
    func waitForReady(timeout: TimeInterval = 15, completion: @escaping (Bool) -> Void) {
        let deadline = Date().addingTimeInterval(timeout)
        pollHealth(deadline: deadline, completion: completion)
    }

    // MARK: - Private

    private func pollHealth(deadline: Date, completion: @escaping (Bool) -> Void) {
        guard Date() < deadline else { completion(false); return }

        var req = URLRequest(url: URL(string: "http://localhost:\(nextPort)")!)
        req.timeoutInterval = 2

        URLSession.shared.dataTask(with: req) { [weak self] _, response, _ in
            if let http = response as? HTTPURLResponse, (200...399).contains(http.statusCode) {
                DispatchQueue.main.async { completion(true) }
            } else {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    self?.pollHealth(deadline: deadline, completion: completion)
                }
            }
        }.resume()
    }

    private func isPortInUse(_ port: Int) -> Bool {
        let sock = socket(AF_INET, SOCK_STREAM, 0)
        guard sock >= 0 else { return false }
        defer { close(sock) }

        var addr = sockaddr_in()
        addr.sin_family = sa_family_t(AF_INET)
        addr.sin_port = UInt16(port).bigEndian
        addr.sin_addr.s_addr = inet_addr("127.0.0.1")

        let result = withUnsafePointer(to: &addr, {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                connect(sock, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
            }
        })
        return result == 0
    }

    private func findNode() -> String? {
        // Try common paths first (faster than shell)
        let candidates = [
            "/opt/homebrew/bin/node",
            "/usr/local/bin/node",
            "/usr/bin/node",
        ]
        if let found = candidates.first(where: { FileManager.default.fileExists(atPath: $0) }) {
            return found
        }

        // Fallback: ask the login shell
        let proc = Process()
        let pipe = Pipe()
        proc.executableURL = URL(fileURLWithPath: "/bin/zsh")
        proc.arguments = ["-l", "-c", "which node"]
        proc.standardOutput = pipe
        proc.standardError = FileHandle.nullDevice
        do {
            try proc.run()
            proc.waitUntilExit()
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let path = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            return path.isEmpty ? nil : path
        } catch {
            return nil
        }
    }
}
