import { useEffect, useState } from "react";
import { classNames } from "../lib/util";
import { dLog } from "../lib/noProd";
import { useInboxZeroBackgroundContext } from "../contexts/InboxZeroBackgroundContext";

function createButtonConfig(
  updateAvailable: boolean,
  updateDownloaded: boolean,
  downloadProgress: number
) {
  if (updateDownloaded)
    return {
      buttonText: "restart to update",
      disabled: false,
      onClick: installUpdate,
      colors:
        "text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 ring-slate-yellow/20 dark:ring-yellow-500/20",
    };
  if (downloadProgress > 0)
    return {
      buttonText: `downloading update ${downloadProgress.toFixed(0)}%`,
      disabled: true,
      onClick: undefined,
      colors:
        "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 ring-blue-600/20 dark:ring-blue-500/20",
    };
  if (updateAvailable)
    return {
      buttonText: "update available",
      disabled: false,
      onClick: downloadUpdate,
      colors:
        "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 ring-green-600/20 dark:ring-green-500/20", // DONE
    };
  return {
    buttonText: "no updates available",
    disabled: true,
    onClick: undefined,
    colors:
      "text-slate-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-500/10 ring-slate-600/20 dark:ring-zinc-500/20", // DONE
  };
}

function installUpdate() {
  window.electron.ipcRenderer.sendMessage("install-update");
}

function downloadUpdate() {
  window.electron.ipcRenderer.sendMessage("download-update");
}

export default function Updater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { isBackgroundOn } = useInboxZeroBackgroundContext();

  useEffect(() => {
    async function handler1() {
      dLog("update available");
      setUpdateAvailable(true);
    }

    return window.electron.ipcRenderer.onUpdateAvailable(handler1);
  });

  useEffect(() => {
    async function handler2() {
      dLog("update not available");
      setUpdateAvailable(false);
    }

    return window.electron.ipcRenderer.onUpdateNotAvailable(handler2);
  });

  useEffect(() => {
    async function handler3() {
      dLog("update downloaded");
      setUpdateDownloaded(true);
    }

    return window.electron.ipcRenderer.onUpdateDownloaded(handler3);
  });

  useEffect(() => {
    async function handler4(progress: number) {
      dLog("update progress", progress);
      setDownloadProgress(progress);
    }

    return window.electron.ipcRenderer.onDownloadProgress(handler4);
  });

  useEffect(() => {
    async function handler5(error: Error) {
      dLog("update error", error);
      setUpdateAvailable(false);
      setUpdateDownloaded(false);
      setDownloadProgress(0);
    }

    return window.electron.ipcRenderer.onUpdateError(handler5);
  });

  const buttonConfig = createButtonConfig(
    updateAvailable,
    updateDownloaded,
    downloadProgress
  );

  if (isBackgroundOn) {
    return <div className="flex gap-x-2"></div>;
  }

  return (
    <div className="flex gap-x-2">
      <button
        onClick={() => {
          buttonConfig.onClick?.();
        }}
        disabled={buttonConfig.disabled}
        className={classNames(
          "inline-flex items-center ",
          "rounded-md px-2 py-1",
          "ring-1 ring-inset",
          "text-xs font-medium",
          buttonConfig.colors
        )}
      >
        <p className="text-[8px] whitespace-nowrap">
          {buttonConfig.buttonText}
        </p>
      </button>
    </div>
  );
}
