import { Dialog, Transition } from "@headlessui/react";
import { classNames } from "../../lib/util";
import { Fragment, useEffect, useRef, useState } from "react";
import { getJWTHeaders } from "../../api/authHeader";
import { getAccessToken } from "../../api/accessToken";
import { useEmailPageOutletContext } from "../../pages/_emailPage";
import { list as gList } from "../../api/gmail/reactQuery/reactQueryHelperFunctions";
import { list as mList } from "../../api/outlook/reactQuery/reactQueryHelperFunctions";
import {
  handleNewThreadsGoogle,
  handleNewThreadsOutlook,
} from "../../lib/sync";
import { useNavigate } from "react-router-dom";
import { PaperAirplaneIcon } from "@heroicons/react/20/solid";
import { IEmailThread, db } from "../../lib/db";
import { OUTLOOK_SELECT_THREADLIST } from "../../api/outlook/constants";
import { SPEEDFORCE_API_URL } from "../../api/constants";
import _ from "lodash";

interface PersonalAIProps {
  show: boolean;
  hide: () => void;
}

export default function PersonalAI({ show, hide }: PersonalAIProps) {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "system",
      content:
        "Hi, I'm your personal email assistant. I can help you look for emails that are tricky to find.",
    },
    // {
    //   role: "user",
    //   content: "When is my reservation for the tech roast?",
    // },
    // {
    //   role: "system",
    //   content:
    //     "I found some emails that might be relevant to your query. Check them out!",
    //   relevantThreads: [
    //     {
    //       id: "id1",
    //       historyId: "historyId1",
    //       email: "email1",
    //       from: "from1",
    //       subject: "Tech Roast Reservation",
    //       snippet: "Your reservation for the tech roast is confirmed!",
    //       date: new Date().getTime(),
    //       unread: false,
    //       labelIds: ["labelId1"],
    //       hasAttachments: false,
    //     },
    //   ],
    // },
    // {
    //   role: "user",
    //   content: "Thanks!",
    // },
    // {
    //   role: "system",
    //   content: "No worries!",
    // },
  ]);

  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const { selectedEmail } = useEmailPageOutletContext();

  useEffect(() => {
    // scroll to the bottom of the message container when new messages are added
    messageContainerRef.current?.scrollTo({
      top: messageContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async () => {
    setLoading(true);
    setInputMessage("");
    setMessages((messages) => [
      ...messages,
      {
        role: "user",
        content: inputMessage,
      },
    ]);

    const authHeader = await getJWTHeaders();
    const accessToken = await getAccessToken(selectedEmail.email);

    const res = await fetch(`${SPEEDFORCE_API_URL}/llm/personalAIQuery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({
        user_query: inputMessage,
        provider: selectedEmail.provider,
        date: new Date().toString(),
        accessToken,
      }),
    });

    const data = await res.json();

    const threadIds = [];
    if (selectedEmail.provider === "google") {
      const listResponse = await gList(accessToken, `q=${data.generatedQuery}`);
      threadIds.push(
        ...(listResponse.threads?.map((thread) => thread.id) || [])
      );

      if (threadIds.length > 0) {
        await handleNewThreadsGoogle(
          accessToken,
          selectedEmail.email,
          threadIds
        );
      }
    } else {
      const listResponse = await mList(
        accessToken,
        `mailFolders/Inbox/messages?${OUTLOOK_SELECT_THREADLIST}&$top=20&${data.generatedQuery}`
      );
      threadIds.push(
        ...(_.uniq(listResponse.value.map((thread) => thread.conversationId)) ||
          [])
      );

      if (threadIds.length > 0) {
        await handleNewThreadsOutlook(
          accessToken,
          selectedEmail.email,
          threadIds
        );
      }
    }

    // get the relevant emails from dexie
    const relevantThreads = await db.emailThreads
      .where("id")
      .anyOf(threadIds)
      .toArray();

    setMessages((messages) => [
      ...messages,
      {
        role: "system",
        content:
          threadIds.length > 0
            ? "Here's what I found for you!"
            : "I couldn't find any emails that might be relevant to your query. Sorry!",
        relevantThreads: relevantThreads,
      },
    ]);

    setLoading(false);
  };

  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={hide}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0">
          <div className="flex min-h-full items-center justify-center text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="h-auto max-h-[400px] w-full max-w-md flex flex-col rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-slate-200 dark:border-zinc-700 text-left align-middle shadow-xl transition-all ease-in-out">
                <div
                  ref={messageContainerRef}
                  className="h-full space-y-4 overflow-y-scroll hide-scroll transition-all"
                >
                  {messages.map((message, idx) => (
                    <Message key={idx} {...message} />
                  ))}
                </div>
                <div className="flex pt-4 mt-4 border-t border-t-slate-200 dark:border-t-zinc-700">
                  <input
                    disabled={loading}
                    type="text"
                    className="w-full min-w-0 outline-none text-md bg-transparent dark:text-white"
                    placeholder={loading ? "Loading..." : "Type a message..."}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                  />
                  <button
                    disabled={loading}
                    onClick={() => void sendMessage()}
                    className="dark:text-white"
                  >
                    <PaperAirplaneIcon className="w-6 h-6" />
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

interface AIMessage {
  role: "user" | "system";
  content: string;
  relevantThreads?: IEmailThread[];
}

function Message({ role, content, relevantThreads }: AIMessage) {
  const navigate = useNavigate();
  return (
    <div
      className={classNames(
        "p-2 rounded-md",
        role === "system" ? "border dark:border-zinc-700" : "text-right"
      )}
    >
      <p
        className={classNames(
          "dark:text-zinc-200",
          role === "system" ? "" : "text-right"
        )}
      >
        {content}
      </p>
      {relevantThreads?.map((thread) => (
        <p
          key={thread.id}
          className="text-blue-500 hover:text-blue-600 underline cursor-pointer"
          onClick={() => {
            navigate(`/thread/${thread.id}`);
          }}
        >
          {thread.subject}
        </p>
      )) || <></>}
    </div>
  );
}
