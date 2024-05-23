import React, { useEffect, useState } from "react";
import { Navigate, RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { SessionContext, useSession } from "./contexts/SessionContext";
import { routeTree } from "./routeTree.gen";
import { ThemeProvider } from "./contexts/ThemeProvider";
import toast, { Toaster, resolveValue } from "react-hot-toast";
import { Session } from "@supabase/supabase-js";
import supabase from "./lib/supabase";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultNotFoundComponent: () => {
    return <Navigate to="/" />;
  },
  context: {
    auth: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

function InnerApp() {
  const auth = useSession();
  return <RouterProvider router={router} context={{ auth }} />;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const isAuthenticated = !!session;

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, isAuthenticated, setSession }}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <InnerApp />
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
            }}
          >
            {(t) => (
              <div
                onClick={() => {
                  toast.dismiss(t.id);
                }}
                className="cursor-pointer select-none rounded-md border bg-background p-2 text-xs text-foreground"
              >
                {resolveValue(t.message, t)}
              </div>
            )}
          </Toaster>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionContext.Provider>
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("No root element found");
const root = createRoot(container); // createRoot(container!) if you use TypeScript

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
