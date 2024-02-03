import { Transition } from "@headlessui/react";
import { classNames } from "../../lib/util";
import { useState } from "react";
import { getJWTHeaders } from "../../api/authHeader";
import { getAccessToken } from "../../api/accessToken";
import { useEmailPageOutletContext } from "../../pages/_emailPage";
import { list } from "../../api/gmail/reactQuery/reactQueryHelperFunctions";
import { handleNewThreadsGoogle } from "../../lib/sync";
import { useNavigate } from "react-router-dom";

interface PersonalAIProps {
  show: boolean;
}

export default function PersonalAI({ show }: PersonalAIProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "system",
      content: "Hi, I'm your personal AI assistant.",
    },
    // {
    //   role: "user",
    //   content: "When is my reservation for the tech roast?",
    // },
    // {
    //   role: "system",
    //   content:
    //     "I found some emails that might be relevant to your query. Check them out!",
    //   relevantThreadIds: ["18d3d8f2295246c6"],
    // },
  ]);

  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const { selectedEmail } = useEmailPageOutletContext();

  const sendMessage = async () => {
    // setLoading(true);
    setMessages([
      ...messages,
      {
        role: "user",
        content: inputMessage,
      },
    ]);

    const authHeader = await getJWTHeaders();
    const accessToken = await getAccessToken(selectedEmail.email);

    const res = await fetch("http://localhost:8080/llm/personalAIQuery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({
        user_query: inputMessage,
        provider: selectedEmail.provider,
        accessToken,
      }),
    });

    const data = await res.json();

    const listResponse = await list(accessToken, data.generatedQuery);
    const threadIds = listResponse.threads?.map((thread) => thread.id) || [];
    if (threadIds.length > 0) {
      await handleNewThreadsGoogle(accessToken, selectedEmail.email, threadIds);
    }

    setMessages([
      ...messages,
      {
        role: "system",
        content:
          threadIds.length > 0
            ? "I found some emails that might be relevant to your query. Check them out!"
            : "I couldn't find any emails that might be relevant to your query. Sorry!",
        relevantThreadIds: threadIds,
      },
    ]);

    // setLoading(false);
  };

  return (
    <Transition
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
      className="absolute z-20"
      show={show}
    >
      <div className="w-screen h-screen flex bg-black bg-opacity-60 items-center justify-center">
        <div className="rounded-md bg-white dark:bg-zinc-900 w-[400px] h-[300px]">
          <div className="h-full overflow-y-scroll hide-scroll">
            {messages.map((message, idx) => (
              <Message key={idx} {...message} />
            ))}
          </div>
          <div className="flex">
            <input
              disabled={loading}
              type="text"
              className="w-full outline-none p-3"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button
              disabled={loading}
              onClick={() => void sendMessage()}
              className="bg-zinc-700 text-white p-3"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </Transition>
  );
}

interface AIMessage {
  role: "user" | "system";
  content: string;
  relevantThreadIds?: string[];
}

function Message({ role, content, relevantThreadIds }: AIMessage) {
  const navigate = useNavigate();
  return (
    <div className={classNames("p-3 my-2 mx-2")}>
      <p
        className={classNames(
          "dark:text-zinc-200",
          role === "system" ? "" : "text-right"
        )}
      >
        {content}
      </p>
      {relevantThreadIds?.map((threadId) => (
        <p
          key={threadId}
          className="text-blue-500 underline cursor-pointer"
          onClick={() => {
            navigate(`/thread/${threadId}`);
          }}
        >
          {threadId}
        </p>
      )) || <></>}
    </div>
  );
}
