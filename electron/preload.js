const { contextBridge, ipcRenderer } = require("electron");

let lastTime = Date.now();

contextBridge.exposeInMainWorld("electronAPI", {
  captureKey: () => {
    const now = Date.now();
    const diff = now - lastTime;
    lastTime = now;
    return diff;
  },

  // Listen for focus events
  onFocusLost: (callback) => ipcRenderer.on("focus-lost", callback),
  onFocusGained: (callback) => ipcRenderer.on("focus-gained", callback),
});