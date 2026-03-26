import Foundation

/// Unix socket server that receives events from aing hooks
final class NorchSocketServer {
    static let shared = NorchSocketServer()
    private let socketPath = "/tmp/norch.sock"
    private var serverSocket: Int32 = -1
    private var isRunning = false

    func start() {
        // Clean up old socket
        unlink(socketPath)

        serverSocket = socket(AF_UNIX, SOCK_STREAM, 0)
        guard serverSocket >= 0 else {
            NSLog("[norch] Failed to create socket")
            return
        }

        var addr = sockaddr_un()
        addr.sun_family = sa_family_t(AF_UNIX)
        withUnsafeMutablePointer(to: &addr.sun_path) { ptr in
            let buf = UnsafeMutableRawPointer(ptr).bindMemory(to: CChar.self, capacity: 104)
            socketPath.withCString { src in
                _ = strcpy(buf, src)
            }
        }

        let bindResult = withUnsafePointer(to: &addr) { ptr in
            ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockPtr in
                bind(serverSocket, sockPtr, socklen_t(MemoryLayout<sockaddr_un>.size))
            }
        }

        guard bindResult == 0 else {
            NSLog("[norch] Failed to bind socket: %d", errno)
            return
        }

        listen(serverSocket, 5)
        isRunning = true
        NSLog("[norch] Socket server listening on %@", socketPath)

        DispatchQueue.global(qos: .background).async { [weak self] in
            self?.acceptLoop()
        }
    }

    private func acceptLoop() {
        while isRunning {
            var clientAddr = sockaddr_un()
            var addrLen = socklen_t(MemoryLayout<sockaddr_un>.size)

            let clientSocket = withUnsafeMutablePointer(to: &clientAddr) { ptr in
                ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockPtr in
                    accept(serverSocket, sockPtr, &addrLen)
                }
            }

            guard clientSocket >= 0 else { continue }

            DispatchQueue.global(qos: .utility).async { [weak self] in
                self?.handleClient(clientSocket)
            }
        }
    }

    private func handleClient(_ socket: Int32) {
        var buffer = [UInt8](repeating: 0, count: 8192)
        var accumulated = ""

        while true {
            let bytesRead = read(socket, &buffer, buffer.count)
            if bytesRead <= 0 { break }

            accumulated += String(bytes: buffer[0..<bytesRead], encoding: .utf8) ?? ""

            while let newlineIdx = accumulated.firstIndex(of: "\n") {
                let line = String(accumulated[accumulated.startIndex..<newlineIdx]).trimmingCharacters(in: .whitespaces)
                accumulated = String(accumulated[accumulated.index(after: newlineIdx)...])

                if !line.isEmpty, let data = line.data(using: .utf8),
                   let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    DispatchQueue.main.async {
                        NorchState.shared.handleEvent(json)
                    }
                }
            }
        }

        close(socket)
    }

    func stop() {
        isRunning = false
        if serverSocket >= 0 { close(serverSocket) }
        unlink(socketPath)
    }
}
