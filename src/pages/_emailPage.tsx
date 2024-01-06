import { Outlet, useOutletContext } from "react-router-dom";
import Titlebar from "../components/Titlebar";
import { ISelectedEmail } from "../lib/db";

interface OutletContext {
  selectedEmail: ISelectedEmail;
}

interface EmailPageProps {
  selectedEmail: ISelectedEmail;
}

export default function EmailPage({ selectedEmail }: EmailPageProps) {
  return (
    <main className="h-screen w-screen flex flex-col dark:bg-zinc-900">
      <Outlet context={{ selectedEmail }} />
    </main>
  );
}

// so that you can use `const {selectedEmail} = useEmailPageOutletContext()`
// in the child components (rendered by the Outlet)
export function useEmailPageOutletContext() {
  return useOutletContext<OutletContext>();
}
