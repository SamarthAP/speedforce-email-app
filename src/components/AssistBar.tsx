import he from "he";
import { IEmailThread, db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import Feedback from "./Feedback";
import { DocumentDuplicateIcon } from "@heroicons/react/20/solid";
import {
  classNames,
  decodeGoogleMessageData,
  extractTextFromHTML,
} from "../lib/util";
import toast from "react-hot-toast";
import { dLog } from "../lib/noProd";
import { useEmailPageOutletContext } from "../pages/_emailPage";

function copyToClipboard(text: string) {
  // document.execCommand("copy"); is not supported anymore
  navigator.clipboard.writeText(text).then(
    () => {
      /* clipboard successfully set */
      toast("Copied to clipboard", {
        icon: "📋",
      });
    },
    () => {
      /* clipboard write failed */
      dLog("Failed to copy to clipboard");
    }
  );
}

interface IAssistBarProps {
  thread: IEmailThread | null;
  setSelectedThread: (threadId: string) => void;
}

export default function AssistBar({
  thread,
  setSelectedThread,
}: IAssistBarProps) {
  const { selectedEmail } = useEmailPageOutletContext();

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

  const latestMessage = useLiveQuery(
    () =>
      db.messages
        .orderBy("date")
        .reverse()
        .first()
        .then((message) => message),
    []
  );

  let emailContent = "";
  let verificationCode = "";

  // only show if message is within last 5 minutes
  if (latestMessage && Date.now() - latestMessage.date < 1000 * 60 * 5) {
    emailContent =
      selectedEmail.provider === "google"
        ? extractTextFromHTML(
            decodeGoogleMessageData(latestMessage.htmlData)
          ) || decodeGoogleMessageData(latestMessage.textData)
        : extractTextFromHTML(latestMessage.htmlData);
    // 6 digit code regex
    const codeRegex = /\b\d{6}\b/g;
    const matches = emailContent.match(codeRegex);
    if (matches) {
      verificationCode = matches[0];
    }
  }

  return (
    <div className="flex-shrink-0 flex flex-col w-64 h-full p-4 border-l border-l-slate-200 dark:border-l-zinc-700 break-words">
      <p className="text-sm dark:text-white mb-4">
        {thread?.from.slice(
          0,
          thread?.from.lastIndexOf("<") == -1
            ? undefined
            : thread?.from.lastIndexOf("<")
        )}
        {/* {thread?.from} */}
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
      {verificationCode && (
        <div className="flex items-center absolute bottom-4">
          <p className="text-xs text-slate-500 dark:text-zinc-400 mr-1">
            Verification Code: {verificationCode.slice(0, 6)}
          </p>
          <button
            onClick={() => copyToClipboard(verificationCode)}
            className={classNames(
              "inline-flex items-center ",
              "rounded-md p-1",
              "ring-1 ring-inset",
              "text-xs font-medium",
              "text-slate-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-500/10 ring-slate-600/20 dark:ring-zinc-500/20"
            )}
          >
            <DocumentDuplicateIcon className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
          </button>
        </div>
      )}
    </div>
  );
}
