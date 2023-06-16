import { useContext, createContext } from "react";

export const SessionContext = createContext(null);

export function useSessionContext() {
  return useContext(SessionContext);
}
