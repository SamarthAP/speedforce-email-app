import { ISelectedEmail, db } from "../lib/db";
import Sidebar from "../components/Sidebar";
import Titlebar from "../components/Titlebar";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import { ArrowSmallLeftIcon } from "@heroicons/react/20/solid";
import Message from "../components/Message";
import SelectedThreadBar from "../components/SelectedThreadBar";

interface ThreadPageProps {
  selectedEmail: ISelectedEmail;
}

export default function ThreadPage({ selectedEmail }: ThreadPageProps) {
  const navigate = useNavigate();
  const { threadId } = useParams();

  const messages = useLiveQuery(() => {
    return db.messages
      .where("threadId")
      .equals(threadId || "")
      .sortBy("date");
  }, [threadId]);

  const thread = useLiveQuery(() => {
    return db.emailThreads.get(threadId || "");
  }, [threadId]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        navigate(-1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col dark:bg-zinc-900">
      <Titlebar />
      <div className="w-full h-full flex overflow-hidden">
        {/* <Sidebar /> */}
        <div className="w-full h-full flex flex-col overflow-hidden">
          <div className="flex px-4 pt-4">
            <div
              className="flex flex-row cursor-pointer items-center"
              onClick={(e) => {
                e.stopPropagation();
                navigate(-1);
              }}
            >
              <ArrowSmallLeftIcon className="h-4 w-4 dark:text-zinc-400 text-slate-500" />
              <p className="dark:text-zinc-400 text-slate-500 text-xs px-1">
                Back
              </p>
            </div>
          </div>
          <div className="dark:text-white p-4 w-full">{thread?.subject}</div>
          <div className="h-full w-full flex flex-col space-y-2 px-4 pb-4 overflow-y-scroll">
            {messages?.map((message) => {
              return (
                <Message
                  message={message}
                  key={message.id}
                  selectedEmail={selectedEmail}
                />
              );
            })}
          </div>
        </div>
        <SelectedThreadBar
          thread={threadId || ""}
          email={selectedEmail.email}
        />
      </div>
    </div>
  );
}
