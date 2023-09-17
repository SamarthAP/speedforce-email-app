import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import store from "./backend/lib/store";
import { decodeGoogleMessageData } from "./lib/util";
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on("save-messages", (_event, messages) => {
  // a simple way to save a user's messages to disk
  // console.log("save-messages", messages);
  const filePath = path.join(app.getPath("userData"), "AllMessages.json");
  // console.log(filePath);

  if (fs.existsSync(filePath)) {
    const existingData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    messages.forEach((message: any) => {
      message.htmlData = decodeGoogleMessageData(message.htmlData);
      delete message.textData;
      existingData[message.id] = message;
    });

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
  } else {
    const newData = {};
    messages.forEach((message: any) => {
      message.htmlData = decodeGoogleMessageData(message.htmlData);
      delete message.textData;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      newData[message.id] = message;
    });
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
  }
});

ipcMain.on("open-link-in-browser", (_event, url) => {
  void shell.openExternal(url);
});

ipcMain.handle("store-get", (_event, key) => {
  return store.get(key);
});

ipcMain.handle("store-set", (_event, key, value) => {
  return store.set(key, value);
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
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// periodically send IPC message to renderer to sync emails every 10 minutes, ensuring that a window is open
setInterval(() => {
  if (mainWindow) {
    mainWindow.webContents.send("sync-emails");
    store.set("client.lastSyncTime", Date.now());
  }
}, 1000 * 60 * 10);

function saveFileToDownloadsFolder(filename: string, data: string) {
  const downloadsPath = app.getPath("downloads");
  const filePath = path.join(downloadsPath, filename);

  const bufferData = Buffer.from(data, "base64");
  fs.writeFileSync(filePath, bufferData);
}

ipcMain.handle("save-file", (_event, filename, data) => {
  try {
    saveFileToDownloadsFolder(filename, data);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
