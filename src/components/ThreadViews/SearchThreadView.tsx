import ThreadList from "../ThreadList";
import Sidebar from "../Sidebar";
import { IEmailThread, db } from "../../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEmailPageOutletContext } from "../../pages/_emailPage";
import AssistBar from "../AssistBar";
import { classNames } from "../../lib/util";
import { ClientInboxTabType } from "../../api/model/client.inbox";
import { useNavigate } from "react-router-dom";
import SearchBar from "../SearchBar";

interface SearchThreadViewProps {
  data: ClientInboxTabType;
  searchItems?: string[];
  setSearchItems?: (searchItems: string[]) => void;
}

export default function SearchThreadView({
  data,
  searchItems,
  setSearchItems,
}: SearchThreadViewProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const [hoveredThread, setHoveredThread] = useState<IEmailThread | null>(null);
  // const [selectedThread, setSelectedThread] = useState<string>("");
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const renderCounter = useRef(0);
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
  }, [scrollPosition]);

  const threadIds = useLiveQuery(() => {
    return db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .primaryKeys();
  });

  // Message list used for search
  const messages = useLiveQuery(async () => {
    return db.messages
      .where("threadId")
      .anyOf(threadIds || [])
      .toArray();
  }, [threadIds]);

  const threadsList = useLiveQuery(
    () => {
      if (data.filterThreadsSearchFnc)
        return data.filterThreadsSearchFnc(
          selectedEmail,
          searchItems || [],
          messages || []
        );

      return [];
    },
    [selectedEmail, data, searchItems],
    []
  );

  const threads: IEmailThread[] = useMemo(() => {
    let threads: IEmailThread[] = [];

    if (threadsList.length && threadsList[0].id === "fake") {
      threads = threadsList.slice(1);
    } else {
      threads = threadsList;
    }

    return threads;
  }, [threadsList]);

  useEffect(() => {
    // If search mode, listen for escape key to exit search mode
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
    <React.Fragment>
      <Sidebar />
      <div className="w-full flex flex-col overflow-hidden">
        <div className="flex flex-row items-center justify-between">
          <nav className="flex items-center pl-6" aria-label="Tabs">
            <h2
              key="Search"
              className={classNames(
                "select-none tracking-wide my-3 mr-1 text-lg px-2 py-1 rounded-md cursor-pointer",
                "font-medium text-black dark:text-white"
              )}
            >
              Search
            </h2>
          </nav>
          <SearchBar setSearchItems={setSearchItems || (() => void 0)} />
        </div>
        <ThreadList
          selectedEmail={selectedEmail}
          threads={threads}
          setHoveredThread={setHoveredThread}
          setScrollPosition={setScrollPosition}
          scrollRef={scrollRef}
          // folderId={data.folderId}
          canArchiveThread={data.canArchiveThread}
          canTrashThread={data.canTrashThread}
          canPermanentlyDeleteThread={data.canDeletePermanentlyThread}
        />
      </div>
      <AssistBar thread={hoveredThread} />
    </React.Fragment>
  );
}
