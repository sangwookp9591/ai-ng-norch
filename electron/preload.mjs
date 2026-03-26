import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("norch", {
  onEvent: (callback) => {
    ipcRenderer.on("norch-event", (_event, data) => callback(data));
  },
});
