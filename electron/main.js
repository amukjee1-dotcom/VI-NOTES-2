const { app, BrowserWindow } = require("electron");
const path = require("path");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  win.loadURL("http://localhost:5173");

  // Detect focus loss (user switches app)
  win.on("blur", () => {
    win.webContents.send("focus-lost");
  });

  win.on("focus", () => {
    win.webContents.send("focus-gained");
  });
}

app.whenReady().then(createWindow);