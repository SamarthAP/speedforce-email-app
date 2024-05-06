import { Switch } from "@headlessui/react";
import { useThemeContext } from "../contexts/ThemeContext";
import { MoonIcon, SunIcon } from "@heroicons/react/20/solid";
import { classNames } from "../lib/util";
import { newEvent } from "../api/emailActions";

export default function ThemeToggle() {
  const themeContext = useThemeContext();
  const enabled = themeContext.theme === "dark";

  return (
    <Switch
      checked={enabled}
      onChange={() => {
        themeContext.setTheme(enabled ? "light" : "dark");
        void newEvent("n/a", "TOGGLE_THEME", {
          theme: enabled ? "light" : "dark",
        });
      }}
      className={classNames(
        enabled ? "bg-zinc-800" : "bg-slate-200",
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
      )}
    >
      <span
        className={classNames(
          enabled ? "translate-x-5" : "translate-x-0",
          "pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out"
        )}
      >
        <span
          className={classNames(
            enabled
              ? "opacity-0 duration-100 ease-out"
              : "opacity-100 duration-200 ease-in",
            "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity"
          )}
          aria-hidden="true"
        >
          <SunIcon className="h-3 w-3 text-black" />
        </span>
        <span
          className={classNames(
            enabled
              ? "opacity-100 duration-200 ease-in"
              : "opacity-0 duration-100 ease-out",
            "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity"
          )}
          aria-hidden="true"
        >
          <MoonIcon className="h-3 w-3 text-black" />
        </span>
      </span>
    </Switch>
  );
}
