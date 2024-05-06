import { useContext, createContext } from "react";

export const HoveredAccountBarItemContext = createContext({
  itemId: "",
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  setItemId: (_index: string) => {},
});

export function useHoveredAccountBarItemContext() {
  return useContext(HoveredAccountBarItemContext);
}

export const AccountBarOpenContext = createContext({
  accountBarIsOpen: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  setAccountBarIsOpen: (_isOpen: boolean) => {},
});

export function useAccountBarOpenContext() {
  return useContext(AccountBarOpenContext);
}
