import { Session } from "@supabase/supabase-js";
import { useContext, createContext, useState, useEffect } from "react";

export interface SessionContextInterface {
  session: Session | null;
  isAuthenticated: boolean;
  setSession: (session: Session | null) => void;
}

const SessionContext = createContext<SessionContextInterface | null>(null);

function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

export { SessionContext, useSession };
