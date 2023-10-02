import ThreadList from "../components/ThreadList";
import Sidebar from "../components/Sidebar";
import { IEmail, IEmailThread, db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useRef, useState } from "react";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { ThreadFeed } from "../components/ThreadFeed";
import AssistBar from "../components/AssistBar";
import { TestSyncButtons } from "../lib/experiments";
import AccountActionsMenu from "./AccountActionsMenu";
import { fullSync } from "../lib/sync";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { WriteMessage } from "../components/WriteMessage";

interface ThreadViewProps {
  folderId: string;
  title: string;
  queryFnc?: (email: string) => Promise<IEmailThread[]>;
}

export default function ThreadView(props: ThreadViewProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const [hoveredThread, setHoveredThread] = useState<IEmailThread | null>(null);
  const [selectedThread, setSelectedThread] = useState<string>("");
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [writeEmailMode, setWriteEmailMode] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const renderCounter = useRef(0);
  const MAX_RENDER_COUNT = 5;
  renderCounter.current = renderCounter.current + 1;

  useEffect(() => {
    if (scrollRef.current) {
      const divVisibleHeight = scrollRef.current.clientHeight;
      const divScrollHeight = scrollRef.current.scrollHeight;
      const maxScroll = divScrollHeight - divVisibleHeight;

      if (scrollPosition > maxScroll) {
        setScrollPosition(maxScroll);
      }

      scrollRef.current.scrollTo(0, scrollPosition);
    }
  }, [selectedThread, scrollPosition]);

  const threads = useLiveQuery(
    () => {
      if (props.queryFnc) return props.queryFnc(selectedEmail.email);

      const emailThreads = db.emailThreads
        .where("email")
        .equals(selectedEmail.email)
        .and((thread) => thread.labelIds?.includes(props.folderId))
        .reverse()
        .sortBy("date");

      return emailThreads;
    },
    [selectedEmail],
    [] // default value
  );

  useEffect(() => {
    // Do not fetch on first render in any scenario. Cap the number of renders to prevent infinite loops on empty folders
    if (renderCounter.current > 1 && renderCounter.current < MAX_RENDER_COUNT) {
      // If there are no threads in the db, do a full sync
      // TODO: Do a partial sync periodically to check for new threads (when not empty)
      if (threads?.length === 0) {
        void fullSync(selectedEmail.email, selectedEmail.provider, {
          folderId: props.folderId,
        });
      }
    }
  }, [props.folderId, selectedEmail.email, selectedEmail.provider, threads]);

  if (writeEmailMode) {
    return (
      <React.Fragment>
        <WriteMessage setWriteEmailMode={setWriteEmailMode} />
        <AssistBar
          thread={hoveredThread}
          setSelectedThread={setSelectedThread}
        />
      </React.Fragment>
    );
  }

  if (selectedThread) {
    return (
      <React.Fragment>
        <ThreadFeed
          selectedThread={selectedThread}
          setSelectedThread={setSelectedThread}
          folderId={props.folderId}
        />
        <AssistBar
          thread={hoveredThread} // NOTE: since this is hovered thread, when you switch current thread from AssistBar, it won't update the past emails list
          setSelectedThread={setSelectedThread}
        />
      </React.Fragment>
    );
  }

  const setSelectedEmail = async (email: IEmail) => {
    await db.selectedEmail.put({
      id: 1,
      email: email.email,
      provider: email.provider,
    });
  };

  return (
    <React.Fragment>
      <Sidebar />
      <div className="w-full flex flex-col overflow-hidden">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-xl pl-8 font-light tracking-wide my-4 text-black dark:text-white">
            {props.title}
          </h2>
          <div className="flex items-center">
            <button
              className="mr-3"
              onClick={() => {
                setWriteEmailMode(true);
              }}
            >
              <PencilSquareIcon className="h-5 w-5 mb-2 shrink-0 text-black dark:text-white" />
            </button>
            <AccountActionsMenu
              selectedEmail={selectedEmail}
              setSelectedEmail={(email) => void setSelectedEmail(email)}
            />
          </div>
        </div>
        {process.env.NODE_ENV !== "production" ? (
          <TestSyncButtons folderId={props.folderId} />
        ) : null}
        <ThreadList
          selectedEmail={selectedEmail}
          threads={threads}
          setSelectedThread={setSelectedThread}
          setHoveredThread={setHoveredThread}
          setScrollPosition={setScrollPosition}
          scrollRef={scrollRef}
          folderId={props.folderId}
        />
      </div>
      <AssistBar thread={hoveredThread} setSelectedThread={setSelectedThread} />
    </React.Fragment>
  );
}
