// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// We don't directly expose the whole ipcRenderer.on API for security reasons.
// Make sure to limit the renderer's access to Electron APIs as much as possible.
// In this case, we explicitly state which channels renderer is allowed to use.

export type Channels =
  | "open-url"
  | "open-link-in-browser"
  | "store-get"
  | "store-set"
  | "save-messages"
  | "sync-emails"
  | "save-file"
  | "update-available"
  | "update-not-available"
  | "download-progress"
  | "update-downloaded"
  | "update-error"
  | "download-update"
  | "install-update"
  | "get-app-version"
  | "add-attachments"
  | "get-os";
// Example use: window.electron.ipcRenderer.sendMessage("open-link-in-browser", url);

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    onOpenUrl(func: (url: string) => unknown) {
      const subscription = (_event: IpcRendererEvent, url: string) => func(url);
      ipcRenderer.on("open-url", subscription);

      return () => {
        ipcRenderer.removeListener("open-url", subscription);
      };
    },
    onSyncEmails(func: () => unknown) {
      const subscription = () => func();
      ipcRenderer.on("sync-emails", subscription);

      return () => {
        ipcRenderer.removeListener("sync-emails", subscription);
      };
    },
    onUpdateAvailable(func: () => unknown) {
      const subscription = () => func();
      ipcRenderer.on("update-available", subscription);

      return () => {
        ipcRenderer.removeListener("update-available", subscription);
      };
    },
    onUpdateNotAvailable(func: () => unknown) {
      const subscription = () => func();
      ipcRenderer.on("update-not-available", subscription);

      return () => {
        ipcRenderer.removeListener("update-not-available", subscription);
      };
    },
    onUpdateDownloaded(func: () => unknown) {
      const subscription = () => func();
      ipcRenderer.on("update-downloaded", subscription);

      return () => {
        ipcRenderer.removeListener("update-downloaded", subscription);
      };
    },
    onDownloadProgress(func: (progress: number) => unknown) {
      const subscription = (_event: IpcRendererEvent, progress: number) =>
        func(progress);
      ipcRenderer.on("download-progress", subscription);

      return () => {
        ipcRenderer.removeListener("download-progress", subscription);
      };
    },
    onUpdateError(func: (error: Error) => unknown) {
      const subscription = (_event: IpcRendererEvent, error: Error) =>
        func(error);
      ipcRenderer.on("update-error", subscription);

      return () => {
        ipcRenderer.removeListener("update-error", subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    invoke(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
};

contextBridge.exposeInMainWorld("electron", electronHandler);

export type ElectronHandler = typeof electronHandler;
