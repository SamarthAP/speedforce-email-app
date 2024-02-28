import { Outlet, useOutletContext } from "react-router-dom";
import { ISelectedEmail } from "../lib/db";
import { KeyPressProvider } from "../contexts/KeyPressContext";

interface OutletContext {
  selectedEmail: ISelectedEmail;
}

interface EmailPageProps {
  selectedEmail: ISelectedEmail;
}

export default function EmailPage({ selectedEmail }: EmailPageProps) {
  return (
    <main className="dark:bg-zinc-900">
      <KeyPressProvider>
        <Outlet context={{ selectedEmail }} />
      </KeyPressProvider>
    </main>
  );
}

// so that you can use `const {selectedEmail} = useEmailPageOutletContext()`
// in the child components (rendered by the Outlet)
export function useEmailPageOutletContext() {
  return useOutletContext<OutletContext>();
}
