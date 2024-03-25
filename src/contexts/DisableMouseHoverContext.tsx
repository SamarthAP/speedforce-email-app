import { createContext, useContext, useState } from "react";

interface DisableMouseHoverContextType {
  disableMouseHover: boolean;
  setDisableMouseHover: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DisableMouseHoverContext = createContext<
  DisableMouseHoverContextType | undefined
>(undefined);

export function useDisableMouseHoverContext() {
  const context = useContext(DisableMouseHoverContext);
  if (context === undefined) {
    throw new Error(
      "useDisableMouseHoverContext must be used within a DisableMouseHoverProvider"
    );
  }
  return context;
}

export function DisableMouseHoverProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [disableMouseHover, setDisableMouseHover] = useState(false);

  const value = {
    disableMouseHover,
    setDisableMouseHover,
  };

  return (
    <DisableMouseHoverContext.Provider value={value}>
      {children}
    </DisableMouseHoverContext.Provider>
  );
}
