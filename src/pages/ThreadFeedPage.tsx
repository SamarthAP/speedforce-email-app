import { ISelectedEmail } from "../lib/db";
import Sidebar from "../components/Sidebar";
import Titlebar from "../components/Titlebar";
import { ThreadFeed } from "../components/ThreadFeed";

interface ThreadFeedPageProps {
  selectedEmail: ISelectedEmail;
}

// NOTE: not in use. we will make a feed
export default function ThreadFeedPage({ selectedEmail }: ThreadFeedPageProps) {
  return (
    <div className="h-screen w-screen flex flex-col dark:bg-zinc-900">
      <Titlebar />
      <div className="h-full flex">
        <Sidebar />
        <div className="w-full"></div>
      </div>
    </div>
  );
}
