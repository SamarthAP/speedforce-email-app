import { useContext, createContext } from "react";

export const HoveredThreadContext = createContext({
  threadIndex: -1,
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  setThreadIndex: (_index: number) => {},
});

export function useHoveredThreadContext() {
  return useContext(HoveredThreadContext);
}
