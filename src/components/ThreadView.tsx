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

interface ThreadViewProps {
  folderId: string;
  title: string;
}

export default function ThreadView(props: ThreadViewProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const [hoveredThread, setHoveredThread] = useState<IEmailThread | null>(null);
  const [selectedThread, setSelectedThread] = useState<string>("");
  const [scrollPosition, setScrollPosition] = useState<number>(0);
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

  const threads = useLiveQuery(() => {
    const emailThreads = db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and((thread) => thread.folderId === props.folderId || selectedEmail.provider === "google")
      .reverse()
      .sortBy("date");

    return emailThreads;
  }, [selectedEmail], []);

  useEffect(() => {
    // Do not fetch on first render in any scenario. Cap the number of renders to prevent infinite loops on empty folders
    if(renderCounter.current > 1 && renderCounter.current < MAX_RENDER_COUNT) {

      // If there are no threads in the db, do a full sync
      // TODO: Do a partial sync periodically to check for new threads (when not empty)
      if(threads?.length === 0) {
        void fullSync(selectedEmail.email, selectedEmail.provider, { folderId: props.folderId });
      }
    }

  }, [threads]);


  const signedInEmails = useLiveQuery(() => {
    return db.emails.orderBy("email").toArray();
  });

  if (selectedThread) {
    return (
      <React.Fragment>
        <ThreadFeed
          selectedThread={selectedThread}
          setSelectedThread={setSelectedThread}
        />
        <AssistBar thread={hoveredThread} />
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
          <AccountActionsMenu 
            signedInEmails={signedInEmails} 
            selectedEmail={selectedEmail} 
            setSelectedEmail={setSelectedEmail} 
          />
        </div>
        <TestSyncButtons folderId={props.folderId}/>
        <ThreadList
          selectedEmail={selectedEmail}
          threads={threads}
          setSelectedThread={setSelectedThread}
          setHoveredThread={setHoveredThread}
          setScrollPosition={setScrollPosition}
          scrollRef={scrollRef}
        />
      </div>
      <AssistBar thread={hoveredThread} />
    </React.Fragment>
  );
}