import { Session } from "@supabase/supabase-js";
import { useContext, createContext } from "react";

export const SessionContext = createContext<Session | null>(null);

export function useSessionContext() {
  return useContext(SessionContext);
}
