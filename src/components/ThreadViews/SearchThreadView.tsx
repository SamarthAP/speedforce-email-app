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
import Titlebar from "../Titlebar";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../../lib/shortcuts";
import { markRead } from "../../lib/sync";
import { useHotkeys } from "react-hotkeys-hook";
import { handleStarClick } from "../../lib/asyncHelpers";
import { HoveredThreadContext } from "../../contexts/HoveredThreadContext";

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
  const [hoveredThreadIndex, setHoveredThreadIndex] = useState<number>(-1);
  // const [selectedThread, setSelectedThread] = useState<string>("");
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const renderCounter = useRef(0);
  renderCounter.current = renderCounter.current + 1;

  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    void 0;
  };

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

  const hoveredThreadContextValue = useMemo(
    () => ({
      thread: hoveredThread,
      setThread: (thread: IEmailThread | null) => void setHoveredThread(thread),
      threadIndex: hoveredThreadIndex,
      setThreadIndex: (index: number) => void setHoveredThreadIndex(index),
    }),
    [hoveredThread, setHoveredThread, hoveredThreadIndex, setHoveredThreadIndex]
  );

  useHotkeys(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ESCAPE], () => {
    navigate(-1);
  });

  useHotkeys(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.COMPOSE], () => {
    navigate("/compose");
  });

  useHotkeys(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SEARCH], () => {
    navigate("/search");
  });

  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR],
    () => {
      if (hoveredThreadIndex > -1) {
        void handleStarClick(
          threadsList[hoveredThreadIndex],
          selectedEmail.email,
          selectedEmail.provider
        );
      }
    },
    [
      hoveredThreadIndex,
      threadsList,
      selectedEmail.email,
      selectedEmail.provider,
    ]
  );

  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SELECT],
    () => {
      if (hoveredThreadIndex > -1) {
        const thread = threadsList[hoveredThreadIndex];
        if (thread.unread) {
          void markRead(selectedEmail.email, selectedEmail.provider, thread.id);
        }
        navigate(`/thread/${thread.id}`);
      }
    },
    [
      hoveredThreadIndex,
      threadsList,
      selectedEmail.email,
      selectedEmail.provider,
    ]
  );

  // move hovered thread down
  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_DOWN],
    () => {
      setHoveredThreadIndex((prev) => {
        if (prev <= -1) {
          return 0;
        } else if (prev < threads.length - 1) {
          return prev + 1;
        } else {
          return threads.length - 1;
        }
      });
    },
    [threads]
  );

  // move hovered thread up
  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_UP],
    () => {
      setHoveredThreadIndex((prev) => {
        if (prev <= -1) {
          return 0;
        } else if (prev > 0) {
          return prev - 1;
        } else {
          return 0;
        }
      });
    },
    [threads]
  );

  return (
    <div className={`overflow-hidden h-screen w-screen flex flex-col`}>
      <Titlebar />

      <div className="w-full h-full flex overflow-hidden">
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
          <HoveredThreadContext.Provider value={hoveredThreadContextValue}>
            <ThreadList
              selectedEmail={selectedEmail}
              threads={threads}
              setScrollPosition={setScrollPosition}
              scrollRef={scrollRef}
              handleScroll={handleScroll}
              canArchiveThread={data.canArchiveThread}
              canTrashThread={data.canTrashThread}
              canPermanentlyDeleteThread={data.canDeletePermanentlyThread}
            />
          </HoveredThreadContext.Provider>
        </div>
        <AssistBar thread={hoveredThread} />
      </div>
    </div>
  );
}
