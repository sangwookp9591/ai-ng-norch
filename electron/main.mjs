import { app, BrowserWindow, screen, ipcMain } from "electron";
import { WebSocketServer } from "ws";
import { createServer as createNetServer } from "net";
import { existsSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

// --- Config ---
const WS_PORT = 4819;
const UNIX_SOCK = "/tmp/norch.sock";

// notchi-style: full screen width, thin bar at top
// The content (grass islands) renders only around the notch area
const COLLAPSED_HEIGHT = 60;
const EXPANDED_HEIGHT = 520;
const EXPANDED_WIDTH = 460;

let mainWindow = null;
let expanded = false;

function getDisplay() {
  return screen.getPrimaryDisplay();
}

// --- Window: notchi-style panel above menu bar ---
function createWindow() {
  const display = getDisplay();
  const screenW = display.size.width;

  // Simple: centered window just wide enough for panels + notch gap
  const collapsedW = 500;

  mainWindow = new BrowserWindow({
    width: collapsedW,
    height: COLLAPSED_HEIGHT,
    x: Math.round((screenW - collapsedW) / 2),
    y: 0,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    skipTaskbar: true,
    roundedCorners: false,
    backgroundColor: "#00000000",
    titleBarStyle: "customButtonsOnHover",
    type: "panel",            // Non-activating panel like notchi
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.cjs"),
    },
  });

  // notchi: NSWindow.Level = .mainMenu + 3
  // Electron levels: normal < floating < torn-off-menu < modal-panel < main-menu < status < pop-up-menu < screen-saver
  // "main-menu" = NSMainMenuWindowLevel = same as menu bar
  // We need above menu bar, so use "status" (one above main-menu)
  mainWindow.setAlwaysOnTop(true, "status", 3);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.setIgnoreMouseEvents(false);

  if (isDev) {
    mainWindow.loadURL("http://localhost:3819");
  } else {
    mainWindow.loadFile(join(__dirname, "../out/index.html"));
  }

  mainWindow.on("blur", () => {
    if (expanded) collapse();
  });

  return mainWindow;
}

function expand() {
  if (!mainWindow || expanded) return;
  expanded = true;

  const display = getDisplay();
  const screenW = display.size.width;

  // Center the expanded panel at the notch
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.setBounds({
    x: Math.round((screenW - EXPANDED_WIDTH) / 2),
    y: 0,
    width: EXPANDED_WIDTH,
    height: EXPANDED_HEIGHT,
  });
  mainWindow.focus();
  mainWindow.webContents.send("norch-expand", true);
}

function collapse() {
  if (!mainWindow || !expanded) return;
  expanded = false;

  const display = getDisplay();
  const screenW = display.size.width;

  const collapsedW = 500;
  mainWindow.setBounds({
    x: Math.round((screenW - collapsedW) / 2),
    y: 0,
    width: collapsedW,
    height: COLLAPSED_HEIGHT,
  });
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.webContents.send("norch-expand", false);
}

// IPC from renderer
ipcMain.on("norch-toggle", () => {
  if (expanded) collapse();
  else expand();
});

ipcMain.on("norch-collapse", () => collapse());


// --- WebSocket + Unix Socket Server (embedded) ---
function startServer() {
  const wss = new WebSocketServer({ port: WS_PORT });
  const clients = new Set();

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
  });

  function broadcast(data) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    for (const client of clients) {
      if (client.readyState === 1) client.send(msg);
    }
    if (mainWindow?.webContents) {
      mainWindow.webContents.send("norch-event", msg);
    }
  }

  if (existsSync(UNIX_SOCK)) unlinkSync(UNIX_SOCK);

  const unixServer = createNetServer((socket) => {
    let buffer = "";
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      let idx;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const event = JSON.parse(line);
          if (!event.timestamp) event.timestamp = Date.now();
          broadcast(event);
        } catch {}
      }
    });
    socket.on("error", () => {});
  });

  unixServer.listen(UNIX_SOCK);
  wss.on("error", () => {});

  app.on("will-quit", () => {
    wss.close();
    unixServer.close();
    if (existsSync(UNIX_SOCK)) unlinkSync(UNIX_SOCK);
  });
}

// --- App lifecycle ---
app.dock?.hide();

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on("window-all-closed", (e) => e.preventDefault());
