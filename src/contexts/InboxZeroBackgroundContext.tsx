import { useContext, createContext } from "react";

export const InboxZeroBackgroundContext = createContext({
  isBackgroundOn: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  setIsBackgroundOn: (_isBackgroundOn: boolean) => {},
});

export function useInboxZeroBackgroundContext() {
  return useContext(InboxZeroBackgroundContext);
}
