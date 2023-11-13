import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import SimpleButton from "./SimpleButton";
import { useState } from "react";
import { Transition } from "@headlessui/react";
import { summarizeThread } from "../api/llm";
import { decodeGoogleMessageData, extractTextFromHTML } from "../lib/util";

interface CompletionObject {
  summary: {
    role: string;
    content: string;
  };
}

interface ISelectedThreadBarProps {
  thread: string;
  email: string;
}

export default function SelectedThreadBar({
  thread,
  email,
}: ISelectedThreadBarProps) {
  const [loadingCompletion, setLoadingCompletion] = useState<boolean>(false);
  const [completion, setCompletion] = useState<CompletionObject>({
    summary: {
      role: "",
      content: "",
    },
  });

  const messages = useLiveQuery(
    () => {
      return db.messages.where("threadId").equals(thread).sortBy("date");
    },
    [thread],
    []
  );

  async function handleSummarizeThread() {
    setLoadingCompletion(true);
    const threadObj = await db.emailThreads.get(thread);
    if (!threadObj) return;
    const { data, error } = await summarizeThread(
      {
        messages: messages?.map((message) => {
          return {
            to: message.toRecipients.join(", "),
            from: message.from,
            date: new Date(message.date).toISOString(),
            emailBody:
              extractTextFromHTML(decodeGoogleMessageData(message.htmlData)) ||
              decodeGoogleMessageData(message.textData),
          };
        }),
        subject: threadObj?.subject,
      },
      email
    );

    setLoadingCompletion(false);
    if (error || !data) {
      // TODO: could send a toast here
      return;
    } else {
      setCompletion(data);
    }
  }

  return (
    <div className="flex-shrink-0 flex flex-col w-64 h-full p-4 border-l border-l-slate-200 dark:border-l-zinc-700 break-words">
      {/* <SimpleButton
        text="Summarize with AI"
        loading={loadingCompletion}
        onClick={() => void handleSummarizeThread()}
        width="w-full"
      /> */}
      <Transition
        show={completion.summary.content ? true : false}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="mt-4 px-3 py-2 flex flex-col bg-slate-200 dark:bg-zinc-700 text-xs text-slate-600 dark:text-zinc-300 rounded-md shadow-sm overflow-hidden">
          {completion.summary.content}
        </div>
      </Transition>
    </div>
  );
}
