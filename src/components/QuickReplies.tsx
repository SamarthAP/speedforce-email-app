import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import ShadowDom from "./ShadowDom";

interface QuickRepliesProps {
  suggestions: {
    email: string;
    messageId: string;
    threadId: string;
    response: string;
  }[];
}

export default function QuickReplies({ suggestions }: QuickRepliesProps) {
  return (
    <div className="w-full flex flex-col items-center space-y-4 overflow-scroll hide-scroll">
      {suggestions
        ? suggestions.map((suggestion) => (
            <QuickReply key={suggestion.messageId} {...suggestion} />
          ))
        : null}
    </div>
  );
}

interface QuickReplyProps {
  email: string;
  messageId: string;
  threadId: string;
  response: string;
}

export const QuickReply = ({
  email,
  messageId,
  threadId,
  response,
}: QuickReplyProps) => {
  const message = useLiveQuery(() => db.messages.get(messageId));
  const thread = useLiveQuery(() => db.emailThreads.get(threadId));

  if (!message || !thread) {
    return null;
  }

  return (
    <div className="w-11/12 flex flex-row p-3 items-start bg-slate-100 dark:bg-zinc-700 rounded-xl">
      <div className="h-full w-1/2 pr-3 border-r border-slate-300 dark:border-zinc-500">
        <div className="text-md text-black dark:text-white font-semibold pb-2">
          Original Message
        </div>
        <div className="text-sm text-black dark:text-white">
          From: {message.from}
        </div>
        <div className="text-sm text-black dark:text-white">
          To: {message.toRecipients.join(", ")}
        </div>
        <div className="text-sm text-black dark:text-white">
          Subject: {thread.subject}
        </div>
        {message.htmlData ? (
          <div className="max-h-56 max-w-1/2 mt-4 p-2 border border-slate-300 dark:border-zinc-500 rounded-md overflow-scroll hide-scroll">
            <ShadowDom
              htmlString={message.htmlData}
              showImages={false}
              bgColorOverride="bg-slate-100 dark:bg-zinc-700"
            />
          </div>
        ) : (
          <div className="max-h-56 max-w-1/2 flex bg-slate-100 dark:bg-zinc-700">
            <div className="text-sm text-slate-500 italic">No Message Body</div>
          </div>
        )}
      </div>
      <div className="h-full w-1/2 flex-1 flex flex-col justify-between pl-3">
        <div>
          <div className="text-md text-black dark:text-white font-semibold pb-2">
            Suggested Response
          </div>
          <div className="text-sm text-black dark:text-white">{response}</div>
        </div>
        <span className="flex flex-row justify-end space-x-4 mt-4">
          <button className="text-xs text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200">
            Edit Response
          </button>
          <button className="text-xs text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200">
            Send
          </button>
        </span>
      </div>
    </div>
  );
};
