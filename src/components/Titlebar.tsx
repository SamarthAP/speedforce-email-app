import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import Updater from "./Updater";
import { useInboxZeroBackgroundContext } from "../contexts/InboxZeroBackgroundContext";

export default function Titlebar() {
  const [appVersion, setAppVersion] = useState("");
  const { isBackgroundOn } = useInboxZeroBackgroundContext();

  useEffect(() => {
    void window.electron.ipcRenderer
      .invoke("get-app-version")
      .then(setAppVersion);
  }, []);

  return (
    <div
      className={`grid grid-cols-10 grid-rows-1 border-b ${
        isBackgroundOn
          ? "border-white/50"
          : "border-slate-200 dark:border-zinc-700"
      }`}
    >
      <div className="col-span-1"></div>

      <div
        className={`col-span-8 h-[32px] flex items-center justify-center text-xs flex-shrink-0 drag-frame ${
          isBackgroundOn ? "text-white" : "text-black dark:text-white"
        }`}
      >
        Speedforce - {appVersion}
      </div>

      <div className="col-span-1 flex flex-row-reverse items-center gap-x-2 mr-2">
        <ThemeToggle />
        <Updater />
      </div>
    </div>
  );
}
