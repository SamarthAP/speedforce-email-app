import { useEffect, useState } from "react";

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
    };
  if (downloadProgress > 0)
    return {
      buttonText: `downloading update ${downloadProgress.toFixed(0)}%`,
      disabled: true,
      onClick: undefined,
    };
  if (updateAvailable)
    return {
      buttonText: "update available",
      disabled: false,
      onClick: downloadUpdate,
    };
  return {
    buttonText: "no updates available",
    disabled: true,
    onClick: undefined,
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

  useEffect(() => {
    async function handler1() {
      console.log("update available");
      setUpdateAvailable(true);
    }

    return window.electron.ipcRenderer.onUpdateAvailable(handler1);
  });

  useEffect(() => {
    async function handler2() {
      console.log("update not available");
      setUpdateAvailable(false);
    }

    return window.electron.ipcRenderer.onUpdateNotAvailable(handler2);
  });

  useEffect(() => {
    async function handler3() {
      console.log("update downloaded");
      setUpdateDownloaded(true);
    }

    return window.electron.ipcRenderer.onUpdateDownloaded(handler3);
  });

  useEffect(() => {
    async function handler4(progress: number) {
      console.log("update progress", progress);
      setDownloadProgress(progress);
    }

    return window.electron.ipcRenderer.onDownloadProgress(handler4);
  });

  useEffect(() => {
    async function handler5(error: Error) {
      console.log("update error", error);
    }

    return window.electron.ipcRenderer.onUpdateError(handler5);
  });

  const buttonConfig = createButtonConfig(
    updateAvailable,
    updateDownloaded,
    downloadProgress
  );

  return (
    <div className="flex gap-x-2">
      <button
        onClick={() => {
          buttonConfig.onClick?.();
        }}
        disabled={buttonConfig.disabled}
        className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20 dark:ring-green-500/20"
      >
        <p className="text-[8px] whitespace-nowrap">
          {buttonConfig.buttonText}
        </p>
      </button>
    </div>
  );
}
