import Sidebar from "../components/Sidebar";
import Titlebar from "../components/Titlebar";
import { ISelectedEmail } from "../lib/db";

interface SettingsProps {
  selectedEmail: ISelectedEmail;
}
export default function Settings({ selectedEmail }: SettingsProps) {
  return (
    <div className="h-screen w-screen flex flex-col dark:bg-zinc-900">
      <Titlebar />
      <Sidebar />
    </div>
  );
}
