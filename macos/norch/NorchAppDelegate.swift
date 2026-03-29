import AppKit
import SwiftUI
import WebKit

@MainActor
final class NorchAppDelegate: NSObject, NSApplicationDelegate {
    private var panel: NSPanel?
    private var webView: WKWebView?
    private var isExpanded = false

    private let collapsedHeight: CGFloat = 38
    private let expandedWidth: CGFloat = 460
    private let expandedHeight: CGFloat = 540

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        setupPanel()
        observeNotifications()

        // Start bundled Node.js server, then connect WS client for events
        NorchProcessManager.shared.start()
        NorchProcessManager.shared.waitForReady { _ in
            NorchSocketServer.shared.start()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        NorchSocketServer.shared.stop()
        NorchProcessManager.shared.stop()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { false }

    // MARK: - Panel

    private func setupPanel() {
        let screen = builtInScreen()
        let sf = screen.frame

        let p = NSPanel(
            contentRect: NSRect(x: sf.origin.x, y: sf.maxY - collapsedHeight, width: sf.width, height: collapsedHeight),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        p.isFloatingPanel = true
        p.level = NSWindow.Level(rawValue: 27)
        p.isOpaque = false
        p.backgroundColor = .clear
        p.hasShadow = false
        p.isMovable = false
        p.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary, .ignoresCycle]

        let view = NSHostingView(rootView: NorchBarView())
        view.layer?.backgroundColor = .clear
        p.contentView = view
        p.orderFrontRegardless()
        self.panel = p
    }

    // MARK: - Expand/Collapse — 노치에서 자연스럽게 늘어남

    private func expand() {
        guard !isExpanded, let panel else { return }
        isExpanded = true

        let screen = builtInScreen()
        let sf = screen.frame
        let x = sf.origin.x + (sf.width - expandedWidth) / 2
        let y = sf.maxY - expandedHeight

        // 기존 패널을 자연스럽게 리사이즈 — 별도 창 안 만듦
        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.35
            ctx.timingFunction = CAMediaTimingFunction(controlPoints: 0.2, 0.9, 0.3, 1.0)
            panel.animator().setFrame(NSRect(x: x, y: y, width: expandedWidth, height: expandedHeight), display: true)
        }

        panel.hasShadow = true
        panel.makeKey()

        // WKWebView 추가 (확장 콘텐츠)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            self?.addWebView()
        }
    }

    private func collapse() {
        guard isExpanded, let panel else { return }
        isExpanded = false

        // 1. 즉시: WebView 제거 + 배경 투명 + 바 뷰 복원
        webView?.removeFromSuperview()
        webView = nil
        panel.backgroundColor = .clear
        panel.hasShadow = false

        let barView = NSHostingView(rootView: NorchBarView())
        barView.layer?.backgroundColor = .clear
        panel.contentView = barView

        // 2. 크기 축소 애니메이션
        let screen = builtInScreen()
        let sf = screen.frame

        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.25
            ctx.timingFunction = CAMediaTimingFunction(controlPoints: 0.4, 0.0, 0.2, 1.0)
            panel.animator().setFrame(
                NSRect(x: sf.origin.x, y: sf.maxY - collapsedHeight, width: sf.width, height: collapsedHeight),
                display: true
            )
        }
    }

    private func addWebView() {
        guard let panel else { return }

        let config = WKWebViewConfiguration()
        let wv = WKWebView(frame: panel.contentView!.bounds, configuration: config)
        wv.autoresizingMask = [.width, .height]
        wv.setValue(false, forKey: "drawsBackground")

        // 확장 모드 + 둥근 모서리
        wv.layer?.cornerRadius = 14
        wv.layer?.masksToBounds = true

        if let url = URL(string: "http://localhost:3819?expanded=true") {
            wv.load(URLRequest(url: url))
        }

        // 기존 콘텐츠를 교체
        panel.contentView = wv
        panel.backgroundColor = NSColor.black.withAlphaComponent(0.95)
        self.webView = wv
    }

    // MARK: - Notifications

    private func observeNotifications() {
        NotificationCenter.default.addObserver(forName: .norchToggleExpand, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                if self?.isExpanded == true { self?.collapse() }
                else { self?.expand() }
            }
        }

        NotificationCenter.default.addObserver(forName: .norchCollapse, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.collapse() }
        }

        NotificationCenter.default.addObserver(forName: NSApplication.didChangeScreenParametersNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.repositionPanel() }
        }

        // ESC로 닫기
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if event.keyCode == 53, self?.isExpanded == true {
                MainActor.assumeIsolated { self?.collapse() }
                return nil
            }
            return event
        }

        // 바깥 클릭으로 닫기
        NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { [weak self] _ in
            MainActor.assumeIsolated {
                if self?.isExpanded == true { self?.collapse() }
            }
        }
    }

    private func repositionPanel() {
        guard !isExpanded, let panel else { return }
        let screen = builtInScreen()
        let sf = screen.frame
        panel.setFrame(NSRect(x: sf.origin.x, y: sf.maxY - collapsedHeight, width: sf.width, height: collapsedHeight), display: true)
    }

    private func builtInScreen() -> NSScreen {
        NSScreen.screens.first(where: {
            guard let id = $0.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? CGDirectDisplayID else { return false }
            return CGDisplayIsBuiltin(id) != 0
        }) ?? NSScreen.main!
    }
}
