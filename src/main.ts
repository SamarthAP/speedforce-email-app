import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

ipcMain.on("open-link-in-browser", (_event, url) => {
  void shell.openExternal(url);
});

let mainWindow: BrowserWindow | null = null;

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("speedforce", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("speedforce");
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

app.on("second-instance", (event, commandLine, _workingDirectory) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }

  mainWindow?.webContents.send("open-url", commandLine.pop()?.slice(0, -1));
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    // if prod check for updates
  })
  .catch((e) => {
    console.error(e);
  });

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 1024,
    minHeight: 457,
    minWidth: 879,
    center: true,
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: !isProd,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  if (!isProd) {
    mainWindow.webContents.openDevTools();
  }
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  } else {
    app.quit(); // TODO: temp fix for timers on mac
  }
});

app.on("open-url", (event, url) => {
  // dialog.showErrorBox("Welcome Back", `You arrived from: ${url}`);
  mainWindow?.focus();

  console.log("open-url", url);
  mainWindow?.webContents.send("open-url", url);
});
