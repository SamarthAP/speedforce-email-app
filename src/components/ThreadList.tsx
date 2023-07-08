import { useEffect, useState } from "react";
import UnreadDot from "./UnreadDot";
import { db } from "../lib/db";

export default function ThreadList() {
  const [threads, setThreads] = useState<any[]>([]);

  useEffect(() => {
    async function getThreads() {
      const threadRes = await db.googleThreads
        .where("email")
        .equals("samarth@sigilinnovation.com")
        .reverse()
        .sortBy("date");

      setThreads(
        threadRes.map((thread) => {
          return {
            subject: thread.subject,
            from: thread.from,
            snippet: thread.snippet,
            date: new Date(thread.date).toDateString(),
          };
        })
      );
    }
    getThreads();
  }, []);

  return (
    <div className="w-full">
      <div className="flex flex-col">
        {threads.map((thread, index) => {
          return (
            <div
              key={index}
              className="grid grid-cols-10 py-1 pl-8 hover:bg-slate-100 cursor-default"
            >
              <div className="text-sm flex items-center font-medium pr-4 col-span-2">
                <div className="pr-2">
                  <UnreadDot />
                </div>

                <span className="truncate">{thread.from}</span>
              </div>
              <div className="col-span-8 grid grid-cols-10">
                <div className="text-sm truncate pr-4 col-span-2">
                  {thread.subject}
                </div>
                <div className="col-span-8 flex">
                  <div className="text-sm truncate text-zinc-400">
                    {thread.snippet}
                  </div>
                  {/* flex-shrink-0 is the class keeping the text from not expanding the height of the row */}
                  <div className="text-sm pl-2 pr-4 flex-shrink-0 text-zinc-400 font-medium">
                    {thread.date}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
