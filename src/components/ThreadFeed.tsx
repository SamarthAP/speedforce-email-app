import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { useEffect } from "react";
import Message from "./Message";

interface ThreadFeedProps {
  selectedThread: string;
  setSelectedThread: (threadId: string) => void;
  folderId: string;
}
// TODO: this component is intentionally called ThreadFeed,
// because in the future, when threads are marked as "done",
// the next thread will show up in place of the current thread,
// acting as a feed. Users will also be able to move up and down
// between threads to switch between them, like a feed.
export function ThreadFeed({
  selectedThread,
  setSelectedThread,
  folderId,
}: ThreadFeedProps) {
  const messages = useLiveQuery(() => {
    return db.messages.where("threadId").equals(selectedThread).sortBy("date");
  }, [selectedThread]);

  const thread = useLiveQuery(() => {
    return db.emailThreads.get(selectedThread);
  }, [selectedThread]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedThread("");
        console.log("Escape key pressed");
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [setSelectedThread]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="dark:text-white p-4 w-full">{thread?.subject}</div>
      <div className="h-full w-full flex flex-col space-y-2 px-4 pb-4 overflow-y-scroll">
        {messages?.map((message) => {
          return (
            <Message message={message} key={message.id} folderId={folderId} />
          );
        })}
      </div>
    </div>
  );
}
