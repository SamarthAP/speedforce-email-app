import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import store from "./backend/lib/store";
import { decodeGoogleMessageData } from "./lib/util";
import "./lib/sentry/main";
import mime from "mime";
import { SPEEDFORCE_API_URL } from "./api/constants";
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const isProd = process.env.NODE_ENV === "production";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

// // WARMING: only for testing update on development mode
// Object.defineProperty(app, "isPackaged", {
//   get() {
//     return true;
//   },
// });

if (isProd) {
  // basic flags
  autoUpdater.autoDownload = true;
  autoUpdater.allowPrerelease = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.setFeedURL({
    provider: "github",
    private: true,
    token: process.env.GH_TOKEN,
    owner: process.env.GH_OWNER,
    repo: process.env.GH_REPO,
  });

  autoUpdater.on("update-available", () => {
    mainWindow?.webContents.send("update-available");
  });

  autoUpdater.on("update-not-available", () => {
    mainWindow?.webContents.send("update-not-available");
  });

  autoUpdater.on("download-progress", (progress) => {
    mainWindow?.webContents.send("download-progress", progress.percent);
  });

  autoUpdater.on("update-downloaded", () => {
    mainWindow?.webContents.send("update-downloaded");
    void autoUpdater.quitAndInstall();
  });

  autoUpdater.on("error", (error) => {
    mainWindow?.webContents.send("update-error", error);
  });

  ipcMain.on("download-update", () => {
    void autoUpdater.downloadUpdate();
  });

  ipcMain.on("install-update", () => {
    void autoUpdater.quitAndInstall();
  });
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

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("get-os", () => {
  return process.platform;
});

ipcMain.handle("download-daily-image", async (_event, accessToken, date) => {
  let imageDownloadUrl = "";

  const authHeader = {
    Authorization: `Bearer ${accessToken}`,
  };

  const res: Response = await fetch(
    `${SPEEDFORCE_API_URL}/inboxZero/getDailyImage?date=` + date,
    {
      method: "GET",
      headers: {
        ...authHeader,
      },
    }
  );

  if (!res.ok) {
    imageDownloadUrl = "";
  } else {
    const responseData = await res.json();
    imageDownloadUrl = responseData[0].image_url;
  }

  if (!imageDownloadUrl) {
    return false;
  }

  const imageRes: Response = await fetch(imageDownloadUrl, {
    method: "GET",
  });

  if (!imageRes.ok) {
    return "";
  }
  // image name without query string
  const imageName = imageDownloadUrl.split("?")[0].split("/").pop();
  if (!imageName) {
    return "";
  }

  // const imagePath = path.join(
  //   app.getPath("userData"),
  //   "dailyImages",
  //   imageName
  // );
  // console.log("imagePath");
  // console.log(imagePath);

  const arrayBuffer = await imageRes.arrayBuffer();
  // const stream = fs.createWriteStream(imagePath);

  // stream.write(Buffer.from(arrayBuffer));
  // stream.end();

  // convert to base64
  const imageBase64 = Buffer.from(arrayBuffer).toString("base64");
  // get file extension
  const fileExtension = path.extname(imageName);

  return `data:image/${fileExtension};base64,${imageBase64}`;
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
      if (isProd) {
        void autoUpdater.checkForUpdates();
      }
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
      devTools: process.env.NODE_ENV === "development",
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
  } else {
    app.quit(); // TODO: temporary fix for timers not stopping and then causing a crash on macOS
  }
});

// periodically send IPC message to renderer to sync emails every 10 minutes, ensuring that a window is open
setInterval(() => {
  if (mainWindow) {
    mainWindow.webContents.send("sync-emails");
    store.set("client.lastSyncTime", Date.now());
  }
}, 1000 * 60 * 10);

// check for updates every 30 mins
setInterval(() => {
  if (isProd) {
    void autoUpdater.checkForUpdates();
  }
}, 1000 * 60 * 30);

function saveFileToDownloadsFolder(filename: string, data: string) {
  const downloadsPath = app.getPath("downloads");
  let filePath = path.join(downloadsPath, filename);

  const extName = path.extname(filename);
  const baseName = path.basename(filename, extName);
  let counter = 1;

  // Check if the file exists and rename it
  while (fs.existsSync(filePath)) {
    filename = `${baseName} (${counter})${extName}`;
    filePath = path.join(downloadsPath, filename);
    counter++;
  }

  const bufferData = Buffer.from(data, "base64");
  fs.writeFileSync(filePath, bufferData);

  return filename;
}

ipcMain.handle("save-file", (_event, filename, data) => {
  try {
    return saveFileToDownloadsFolder(filename, data);
  } catch (e) {
    return "";
  }
});

ipcMain.handle("open-downloads-folder", (_event, filename: string) => {
  try {
    const downloadsPath = app.getPath("downloads");
    const filePath = path.join(downloadsPath, filename);
    shell.showItemInFolder(filePath);

    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle("add-attachments", async (_event) => {
  if (!mainWindow) {
    return;
  }

  const dialogReturn = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "openDirectory", "multiSelections"],
  });

  const attachments = [];
  for (const file of dialogReturn.filePaths) {
    const fileData = fs.readFileSync(file);
    const fileBase64 = fileData.toString("base64");
    const filename = path.basename(file);
    const size = fs.statSync(file).size;
    const mimeType = mime.lookup(file) || "application/octet-stream";
    attachments.push({
      filename,
      mimeType,
      size,
      data: fileBase64,
    });
  }
  return attachments;
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
