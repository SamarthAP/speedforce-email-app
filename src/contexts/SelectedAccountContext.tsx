import { createContext, useContext } from "react";
import { SelectedAccount } from "../lib/localstorage";

export interface SelectedAccountContextInterface {
  selectedAccount: SelectedAccount | null;
  setSelectedAccount: (selectedAccount: SelectedAccount | null) => void;
}

const SelectedAccountContext =
  createContext<SelectedAccountContextInterface | null>(null);

function useSelectedAccount() {
  const context = useContext(SelectedAccountContext);
  if (!context) {
    throw new Error(
      "useSelectedAccount must be used within a SelectedAccountProvider"
    );
  }
  return context;
}

export { SelectedAccountContext, useSelectedAccount };
