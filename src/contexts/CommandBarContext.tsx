import { useContext, createContext } from "react";

export const HoveredCommandBarItemContext = createContext({
  itemId: "",
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  setItemId: (_index: string) => {},
});

export function useHoveredCommandBarItemContext() {
  return useContext(HoveredCommandBarItemContext);
}

export const CommandBarOpenContext = createContext({
  commandBarIsOpen: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  setCommandBarIsOpen: (_isOpen: boolean) => {},
});

export function useCommandBarOpenContext() {
  return useContext(CommandBarOpenContext);
}
