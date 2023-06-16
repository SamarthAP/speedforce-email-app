import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeContext } from "./contexts/ThemeContext";
import AppRouter from "./routing/AppRouter";
import supabase from "./lib/supabase";
import Login from "./pages/Login";
import { SessionContext } from "./contexts/SessionContext";

const container = document.getElementById("root");
const root = createRoot(container); // createRoot(container!) if you use TypeScript

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
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

  const themeValue = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

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

root.render(<App />);
