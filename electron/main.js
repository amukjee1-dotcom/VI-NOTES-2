const { app, BrowserWindow } = require("electron");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load your React app (Vite)
  mainWindow.loadURL("http://localhost:5176");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App ready
app.whenReady().then(createWindow);

// Close app when all windows closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Re-open app (Mac)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});