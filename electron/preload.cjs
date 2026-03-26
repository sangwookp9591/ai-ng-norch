const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("norch", {
  toggle: () => ipcRenderer.send("norch-toggle"),
  collapse: () => ipcRenderer.send("norch-collapse"),
  mouseEnter: () => ipcRenderer.send("norch-mouse-enter"),
  mouseLeave: () => ipcRenderer.send("norch-mouse-leave"),
  onExpand: (callback) => {
    ipcRenderer.on("norch-expand", (_event, expanded) => callback(expanded));
  },
  onEvent: (callback) => {
    ipcRenderer.on("norch-event", (_event, data) => {
      try {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        callback(parsed);
      } catch {}
    });
  },
});
