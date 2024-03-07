import { XCircleIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useHotkeys } from "react-hotkeys-hook";
import { useLocalStorage } from "usehooks-ts";

export interface ShortcutsFloaterProps {
  items: {
    keystrokes: string[];
    description: string;
    isSequential?: boolean;
  }[];
}
export default function ShortcutsFloater({ items }: ShortcutsFloaterProps) {
  const [visible, setVisible] = useState(() => {
    const isVisible = localStorage.getItem("shortcutsFloaterVisible");

    if (isVisible === "true") {
      return true;
    }

    return false;
  });

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      const visible = localStorage.getItem("shortcutsFloaterVisible");
      setVisible(visible === "true");
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useLocalStorage;

  useHotkeys(
    "Shift+Slash",
    () => {
      if (!visible) {
        localStorage.setItem("shortcutsFloaterVisible", "true");
        window.dispatchEvent(new StorageEvent("storage"));
        // setVisible(true);
      } else {
        localStorage.setItem("shortcutsFloaterVisible", "false");
        window.dispatchEvent(new StorageEvent("storage"));
        // setVisible(false);
      }
    },
    [visible]
  );

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 w-full z-10">
      <div className="relative m-2 px-2 py-1 rounded-lg dark:bg-black/20 backdrop-blur-md border border-black/20 dark:border-white/20 flex gap-x-3 justify-center items-center">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-x-1">
            {item.keystrokes.map((keystroke, index) => (
              <div key={index} className="flex items-center gap-x-1">
                {item.isSequential && index > 0 ? (
                  <div className="text-xs text-slate-400 dark:text-zinc-500 select-none">
                    then
                  </div>
                ) : null}
                <div className="px-2 py-1 rounded-md bg-slate-400/60 dark:bg-zinc-500/40 text-white dark:text-zinc-900 text-xs select-none">
                  {keystroke}
                </div>
              </div>
            ))}
            <div className="text-xs text-slate-400 dark:text-zinc-500 select-none">
              {item.description}
            </div>
          </div>
        ))}
        <div className="absolute right-0 mr-2 flex items-center">
          <button
            onClick={() => {
              localStorage.setItem("shortcutsFloaterVisible", "false");
              setVisible(false);
            }}
          >
            <XCircleIcon className="text-slate-400 dark:text-zinc-500 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
