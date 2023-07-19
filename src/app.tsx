import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeContext } from "./contexts/ThemeContext";
import AppRouter from "./routing/AppRouter";
import supabase from "./lib/supabase";
import Login from "./pages/Login";
import { SessionContext } from "./contexts/SessionContext";
import { Session } from "@supabase/supabase-js";

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const [theme, setTheme] = useState(() => {
    const localTheme = localStorage.getItem("theme");
    if (localTheme === "dark") {
      return "dark";
    }
    if (localTheme === "light") {
      return "light";
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      // theme isn't set, but OS is dark
      return "dark";
    }
    return "light"; // default to light
  });

  const themeValue = useMemo(
    () => ({
      theme,
      setTheme: (_theme: string) => {
        localStorage.setItem("theme", _theme); // save theme to localstorage
        setTheme(_theme); // set theme in react
      },
    }),
    [theme, setTheme]
  );

  return (
    <SessionContext.Provider value={session}>
      <div className={`${theme}`}>
        <ThemeContext.Provider value={themeValue}>
          {session ? <AppRouter /> : <Login />}
        </ThemeContext.Provider>
      </div>
    </SessionContext.Provider>
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("No root element found");
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);
