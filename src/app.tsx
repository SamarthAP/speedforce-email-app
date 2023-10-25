import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeContext } from "./contexts/ThemeContext";
import AppRouter from "./routing/AppRouter";
import supabase from "./lib/supabase";
import Login from "./pages/Login";
import { SessionContext } from "./contexts/SessionContext";
import { Session } from "@supabase/supabase-js";
import { Toaster } from "react-hot-toast";
import InitialLoadingScreen from "./components/InitialLoadingScreen";
import { asyncWithLDProvider } from "launchdarkly-react-client-sdk";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
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
          {/* {session ? <AppRouter /> : <Login />} */}
          {loading ? (
            <InitialLoadingScreen />
          ) : session ? (
            <AppRouter />
          ) : (
            <Login />
          )}
          <Toaster position="bottom-center" reverseOrder={false} />
        </ThemeContext.Provider>
      </div>
    </SessionContext.Provider>
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("No root element found");
const root = createRoot(container); // createRoot(container!) if you use TypeScript
void (async () => {
  const LDProvider = await asyncWithLDProvider({
    clientSideID: process.env.LAUNCHDARKLY_CLIENT_ID || "",
  });

  root.render(
    <LDProvider>
      <App />
    </LDProvider>
  );
})();
