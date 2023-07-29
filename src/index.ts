import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { randomUUID } from "crypto";
import store from "./backend/lib/store";
import { init } from "@sentry/electron/main"

// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}
init({ 
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
});

let mainWindow: BrowserWindow | null = null;

ipcMain.on("open-link-in-browser", (_event, url) => {
  void shell.openExternal(url);
});

ipcMain.handle("store-get", (_event, key) => {
  return store.get(key);
});

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
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // dialog.showErrorBox(
    //   "Welcome Back",
    //   `You arrived from: ${commandLine.pop().slice(0, -1)}`
    // );

    mainWindow?.webContents.send("open-url", commandLine.pop()?.slice(0, -1));
  });

  // Create mainWindow, load the rest of the app, etc...
  app
    .whenReady()
    .then(() => {
      createWindow();
      app.on("activate", () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });

      createClientId();

      setTimeout(() => {
        throw new Error('Prod asynchronous error');
      }, 5000);
    })
    .catch(console.log);

  app.on("open-url", (event, url) => {
    // dialog.showErrorBox("Welcome Back", `You arrived from: ${url}`);
    mainWindow?.focus();

    mainWindow?.webContents.send("open-url", url);
  });
}

// Create a client ID if one doesn't exist
const createClientId = (): void => {
  const clientId = store.get("client.id");
  if (!clientId) {
    const uuid = randomUUID();
    store.set("client.id", uuid);
  }
};

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 1024,
    minHeight: 457,
    minWidth: 879,
    center: true,
    frame: false,
    // titleBarStyle: "hidden",
    titleBarStyle: "hidden",
    trafficLightPosition: {
      x: 8,
      y: 8,
    },
    titleBarOverlay: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  void mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
