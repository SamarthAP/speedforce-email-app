import he from "he";
import { IEmailThread, db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import Feedback from "./Feedback";

interface IAssistBarProps {
  thread: IEmailThread | null;
  setSelectedThread: (threadId: string) => void;
}

export default function AssistBar({
  thread,
  setSelectedThread,
}: IAssistBarProps) {
  const emailThreads = useLiveQuery(
    () =>
      db.emailThreads
        .where("from")
        .equals(thread?.from || "")
        .and((t) => t.id !== thread?.id) // exclude the original thread
        .reverse()
        .sortBy("date")
        .then((threads) => threads.slice(0, 5)),
    [thread]
  );

  return (
    <div className="flex-shrink-0 flex flex-col w-64 h-full p-4 border-l border-l-slate-200 dark:border-l-zinc-700 break-words">
      <p className="text-sm dark:text-white mb-4">
        {thread?.from.slice(0, thread?.from.lastIndexOf("<"))}
      </p>
      <p className="mb-2 text-sm font-bold text-slate-500 dark:text-zinc-400">
        {thread?.subject}
      </p>
      <p className="text-sm text-slate-500 dark:text-zinc-400">
        {he.decode(thread?.snippet || "")}
      </p>
      <div className="flex flex-col space-y-1 mt-4 pt-4 border-t border-t-slate-200 dark:border-t-zinc-700">
        <p className="text-xs dark:text-white">Past emails</p>
        {emailThreads?.map((thread, idx) => (
          <div
            key={idx}
            onClick={() => void setSelectedThread(thread.id)}
            className="text-xs text-slate-500 dark:text-zinc-400 hover:underline hover:underline-offset-4 cursor-pointer"
          >
            {thread.subject}
          </div>
        ))}
      </div>
      <div className="fixed bottom-10 right-0 h-18 w-6 rounded-l-md bg-slate-600 dark:bg-zinc-200 shrink-0">
        <Feedback />
      </div>
      {/* <Calendar /> */}
    </div>
  );
}
