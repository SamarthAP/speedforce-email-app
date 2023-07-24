import ThreadList from "../components/ThreadList";
import Sidebar from "../components/Sidebar";
import { IGoogleThread, db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useRef, useState } from "react";
import { useEmailPageOutletContext } from "./_emailPage";
import { ThreadFeed } from "../components/ThreadFeed";
import AssistBar from "../components/AssistBar";
import { TestSyncButtons } from "../lib/experiments";

export default function Home() {
  const { selectedEmail } = useEmailPageOutletContext();
  const [hoveredThread, setHoveredThread] = useState<IGoogleThread | null>(
    null
  );
  const [selectedThread, setSelectedThread] = useState<string>("");
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    return db.googleThreads
      .where("email")
      .equals(selectedEmail.email)
      .reverse()
      .sortBy("date");
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

  return (
    <React.Fragment>
      <Sidebar />
      <div className="w-full flex flex-col overflow-hidden">
        <h2 className="text-xl pl-8 font-light tracking-wide my-4 text-black dark:text-white">
          Important
        </h2>
        <TestSyncButtons />
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
