import { useEffect } from "react";
import { db } from "../lib/db";

function cleanEmailTextString(text: string) {
  // Trim leading and trailing whitespace
  let str = text.trim();

  // Replace multiple line breaks with a single line break
  str = str.replace(/(\r\n|\r|\n){2,}/g, "\n");

  // Replace multiple spaces with a single space
  str = str.replace(/\s{2,}/g, " ");

  return str;
}

export interface ThreadSummaryHoverCardProps {
  show: boolean;
  threadId: string;
}

export default function ThreadSummaryHoverCard({
  show,
  threadId,
}: ThreadSummaryHoverCardProps) {
  useEffect(() => {
    if (show) {
      void db.messages
        .where("threadId")
        .equals(threadId)
        .sortBy("date")
        .then((messages) => {
          // console.log(messages);
        });
    }
  }, [show, threadId]);

  if (!show) return null;

  return (
    <div
      className={`absolute mt-1 z-10 p-2 max-w-[256px] rounded-md border border-slate-200 dark:border-zinc-700 text-black dark:text-white bg-slate-100 dark:bg-zinc-800 text-xs`}
    >
      {threadId}
    </div>
  );
}
