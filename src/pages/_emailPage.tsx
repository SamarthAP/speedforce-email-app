import { Outlet, useOutletContext } from "react-router-dom";
import { ISelectedEmail } from "../lib/db";
import { KeyPressProvider } from "../contexts/KeyPressContext";
import { useMemo, useState } from "react";
import { CommandBarOpenContext } from "../contexts/CommandBarContext";
import { AccountBarOpenContext } from "../contexts/AccountBarContext";

interface OutletContext {
  selectedEmail: ISelectedEmail;
}

interface EmailPageProps {
  selectedEmail: ISelectedEmail;
}

export default function EmailPage({ selectedEmail }: EmailPageProps) {
  const [commandBarIsOpen, setCommandBarIsOpen] = useState(false);
  const [accountBarIsOpen, setAccountBarIsOpen] = useState(false);

  const commandBarContextValue = useMemo(
    () => ({
      commandBarIsOpen: commandBarIsOpen,
      setCommandBarIsOpen: (isOpen: boolean) => setCommandBarIsOpen(isOpen),
    }),
    [commandBarIsOpen, setCommandBarIsOpen]
  );

  const accountBarContextValue = useMemo(
    () => ({
      accountBarIsOpen: accountBarIsOpen,
      setAccountBarIsOpen: (isOpen: boolean) => setAccountBarIsOpen(isOpen),
    }),
    [accountBarIsOpen, setAccountBarIsOpen]
  );

  return (
    <main className="dark:bg-zinc-900">
      <KeyPressProvider>
        <CommandBarOpenContext.Provider value={commandBarContextValue}>
          <AccountBarOpenContext.Provider value={accountBarContextValue}>
            <Outlet context={{ selectedEmail }} />
          </AccountBarOpenContext.Provider>
        </CommandBarOpenContext.Provider>
      </KeyPressProvider>
    </main>
  );
}

// so that you can use `const {selectedEmail} = useEmailPageOutletContext()`
// in the child components (rendered by the Outlet)
export function useEmailPageOutletContext() {
  return useOutletContext<OutletContext>();
}
