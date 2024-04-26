import { Dialog, Transition } from "@headlessui/react";
import { classNames } from "../../lib/util";
import { Fragment, useEffect, useRef, useState } from "react";
import { getAccessToken } from "../../api/accessToken";
import { useEmailPageOutletContext } from "../../pages/_emailPage";
import {
  handleNewThreadsGoogle,
  handleNewThreadsOutlook,
} from "../../lib/sync";
import { useNavigate } from "react-router-dom";
import { PaperAirplaneIcon } from "@heroicons/react/20/solid";
import { IEmailThread, db } from "../../lib/db";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getJWTHeaders } from "../../api/authHeader";

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
        "Hi, I'm your personal email assistant. What can I help you with today?",
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

  async function sendAIServiceMessage() {
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

    const response = await fetch("https://ai-service.speedforce.me/chat", {
      method: "POST",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_query: inputMessage,
        email: selectedEmail.email,
        provider: selectedEmail.provider,
      }),
    });

    const data = await response.json();

    if (data.combined_messages.length) {
      if (selectedEmail.provider === "google") {
        await handleNewThreadsGoogle(
          await getAccessToken(selectedEmail.email),
          selectedEmail.email,
          data.combined_messages.map((itm: any) => itm.thread_id)
        );
      } else if (selectedEmail.provider === "outlook") {
        await handleNewThreadsOutlook(
          await getAccessToken(selectedEmail.email),
          selectedEmail.email,
          data.combined_messages.map((itm: any) => itm.thread_id)
        );
      }
    }

    const relevantThreads = await db.emailThreads
      .where("id")
      .anyOf(data.combined_messages.map((itm: any) => itm.thread_id))
      .toArray();

    setMessages((messages) => [
      ...messages,
      {
        role: "system",
        content: data.llm_response,
        relevantThreads,
      },
    ]);

    setLoading(false);
  }

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
              <Dialog.Panel className="h-auto max-h-[400px] w-full max-w-[90%] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-slate-200 dark:border-zinc-700 text-left align-middle shadow-xl transition-all ease-in-out">
                <div
                  ref={messageContainerRef}
                  className="h-full w-full space-y-4 overflow-y-scroll overflow-x-scroll hide-scroll transition-all"
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
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        // void sendMessage();
                        void sendAIServiceMessage();
                      }
                    }}
                  />
                  <button
                    disabled={loading}
                    onClick={() => void sendAIServiceMessage()}
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
        "p-2 overflow-x-scroll rounded-md flex flex-col",
        role === "system"
          ? "border border-slate-200 dark:border-zinc-700"
          : "text-right"
      )}
    >
      {/* <p
        className={classNames(
          "dark:text-zinc-200",
          role === "system" ? "" : "text-right"
        )}
      >
        {content}
      </p> */}
      <Markdown
        rehypePlugins={[remarkGfm]}
        className={"dark:text-zinc-200 text-slate-700 p-2 markdown-body"}
      >
        {content}
      </Markdown>
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
