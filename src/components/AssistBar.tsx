import he from "he";
import { IEmailThread } from "../lib/db";

interface IAssistBarProps {
  thread: IEmailThread | null;
}

export default function AssistBar({ thread }: IAssistBarProps) {
  return (
    <div className="flex-shrink-0 flex flex-col w-64 h-full p-4 border-l border-l-slate-200 dark:border-l-zinc-700">
      <p className="text-sm dark:text-white mb-4">{thread?.from}</p>
      <p className="text-sm text-slate-500 dark:text-zinc-400">
        {he.decode(thread?.snippet || "")}
      </p>
      {/* <Calendar /> */}
    </div>
  );
}
