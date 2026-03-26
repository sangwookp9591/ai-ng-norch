import AppKit
import WebKit

// ─── Config ───────────────────────────────────────────────
let WEB_URL = "http://localhost:3819"
let EXPANDED_HEIGHT: CGFloat = 520
let EXPANDED_WIDTH: CGFloat = 460

// ─── App Entry ────────────────────────────────────────────
@main
struct NorchAppMain {
    static func main() {
        let app = NSApplication.shared
        app.setActivationPolicy(.accessory)

        let delegate = NorchAppDelegate()
        app.delegate = delegate
        app.run()
    }
}

// ─── App Delegate ─────────────────────────────────────────
class NorchAppDelegate: NSObject, NSApplicationDelegate {
    var panel: NorchPanel!

    func applicationDidFinishLaunching(_ notification: Notification) {
        panel = NorchPanel()
        panel.show()
    }
}

// ─── Notch Panel ──────────────────────────────────────────
class NorchPanel: NSPanel {
    private var webView: WKWebView!
    private var isExpanded = false
    private var collapsedFrame: NSRect = .zero

    init() {
        let screen = NSScreen.builtInOrMain
        let screenFrame = screen.frame

        // ─── Calculate notch position ───
        // macOS coordinate system: y=0 is bottom of screen
        // screen.frame.maxY = top of screen (including notch area)
        // screen.safeAreaInsets.top = height of notch + menu bar area
        //
        // We want the window to cover the notch area itself.
        // The notch starts at the very top of the screen.

        let notchHeight = screen.safeAreaInsets.top  // ~38px on MacBook Pro
        let collapsedHeight = max(notchHeight, 38)   // fallback if no notch

        // Full screen width, positioned at the very top
        let frame = NSRect(
            x: screenFrame.origin.x,
            y: screenFrame.maxY - collapsedHeight,
            width: screenFrame.width,
            height: collapsedHeight
        )

        super.init(
            contentRect: frame,
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )

        self.collapsedFrame = frame

        // ─── notchi-identical window config ───
        self.isOpaque = false
        self.backgroundColor = .clear
        self.hasShadow = false
        // NSMainMenuWindowLevel = 24 in macOS. SPM executables return 0 for .mainMenu.
        // Hardcode 24 + 3 = 27 like notchi.
        self.level = NSWindow.Level(rawValue: 27)
        self.isFloatingPanel = true
        self.isMovable = false
        self.collectionBehavior = [
            .canJoinAllSpaces,
            .stationary,
            .fullScreenAuxiliary,
            .ignoresCycle
        ]
        self.becomesKeyOnlyIfNeeded = true

        // Allow mouse events to pass through transparent areas
        self.ignoresMouseEvents = false

        NSLog("[norch] Screen: %.0fx%.0f", screenFrame.width, screenFrame.height)
        NSLog("[norch] SafeArea top: %.0f", screen.safeAreaInsets.top)
        NSLog("[norch] Window y: %.0f, height: %.0f", frame.origin.y, frame.height)
        NSLog("[norch] Window level: %d (mainMenu+3)", self.level.rawValue)

        setupWebView()
    }

    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")

        let script = WKUserScript(
            source: """
            window.norch = {
                toggle: function() { window.webkit.messageHandlers.norch.postMessage('toggle'); },
                collapse: function() { window.webkit.messageHandlers.norch.postMessage('collapse'); },
                mouseEnter: function() {},
                mouseLeave: function() {},
                onExpand: function(cb) { window._norchExpandCb = cb; },
                onEvent: function(cb) { window._norchEventCb = cb; }
            };
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        config.userContentController.addUserScript(script)
        config.userContentController.add(self, name: "norch")

        webView = WKWebView(frame: self.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.setValue(false, forKey: "drawsBackground")

        self.contentView!.addSubview(webView)

        if let url = URL(string: WEB_URL) {
            webView.load(URLRequest(url: url))
            NSLog("[norch] Loading %@", WEB_URL)
        }
    }

    func show() {
        self.orderFrontRegardless()
        NSLog("[norch] Shown at y=%.0f level=%d", self.frame.origin.y, self.level.rawValue)
    }

    func expand() {
        guard !isExpanded else { return }
        isExpanded = true

        let screen = NSScreen.builtInOrMain
        let screenFrame = screen.frame
        let x = screenFrame.origin.x + (screenFrame.width - EXPANDED_WIDTH) / 2
        let y = screenFrame.maxY - EXPANDED_HEIGHT

        NSAnimationContext.runAnimationGroup({ ctx in
            ctx.duration = 0.3
            ctx.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
            self.animator().setFrame(
                NSRect(x: x, y: y, width: EXPANDED_WIDTH, height: EXPANDED_HEIGHT),
                display: true
            )
        })

        self.makeKey()
        webView.evaluateJavaScript("window._norchExpandCb && window._norchExpandCb(true)")
    }

    func collapse() {
        guard isExpanded else { return }
        isExpanded = false

        NSAnimationContext.runAnimationGroup({ ctx in
            ctx.duration = 0.25
            ctx.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
            self.animator().setFrame(self.collapsedFrame, display: true)
        })

        webView.evaluateJavaScript("window._norchExpandCb && window._norchExpandCb(false)")
    }

    override func resignKey() {
        super.resignKey()
        if isExpanded { collapse() }
    }

    override func keyDown(with event: NSEvent) {
        if event.keyCode == 53 { collapse() }
        else { super.keyDown(with: event) }
    }
}

// ─── WKScriptMessageHandler ──────────────────────────────
extension NorchPanel: WKScriptMessageHandler {
    func userContentController(_ uc: WKUserContentController, didReceive msg: WKScriptMessage) {
        guard let s = msg.body as? String else { return }
        if s == "toggle" { isExpanded ? collapse() : expand() }
        else if s == "collapse" { collapse() }
    }
}

// ─── WKNavigationDelegate ────────────────────────────────
extension NorchPanel: WKNavigationDelegate {
    func webView(_ wv: WKWebView, didFinish nav: WKNavigation!) {
        NSLog("[norch] Page loaded")
    }
}

// ─── NSScreen ────────────────────────────────────────────
extension NSScreen {
    static var builtInOrMain: NSScreen {
        for s in NSScreen.screens {
            let id = s.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? CGDirectDisplayID ?? 0
            if CGDisplayIsBuiltin(id) != 0 { return s }
        }
        return NSScreen.main ?? NSScreen.screens[0]
    }
}
