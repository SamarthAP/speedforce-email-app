import ThreadList from "../components/ThreadList";
import Sidebar from "../components/Sidebar";
import { IEmail, IEmailThread, db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { ThreadFeed } from "../components/ThreadFeed";
import AssistBar from "../components/AssistBar";
import { TestSyncButtons } from "../lib/experiments";
import AccountActionsMenu from "./AccountActionsMenu";
import { fullSync, partialSync } from "../lib/sync";
import { PencilSquareIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { WriteMessage } from "../components/WriteMessage";
import SelectedThreadBar from "./SelectedThreadBar";
import TooltipPopover from "./TooltipPopover";
import { useTooltip } from "./UseTooltip";
import { classNames } from "../lib/util";
import { ClientInboxTabType } from "../api/model/client.inbox";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useInboxZeroBackgroundContext } from "../contexts/InboxZeroBackgroundContext";

const MAX_RENDER_COUNT = 5;
const MIN_REFRESH_DELAY_MS = 1000;

interface ThreadViewProps {
  tabs: ClientInboxTabType[];
  searchItems?: string[];
  setSearchItems?: (searchItems: string[]) => void;
  wrapperType?: string;
}

export default function ThreadView({
  tabs,
  searchItems,
  setSearchItems,
  wrapperType,
}: ThreadViewProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const [selectedTab, setSelectedTab] = useState<ClientInboxTabType>(tabs[0]);
  const [hoveredThread, setHoveredThread] = useState<IEmailThread | null>(null);
  const [selectedThread, setSelectedThread] = useState<string>("");
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [writeEmailMode, setWriteEmailMode] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tooltipData, handleMouseEnter, handleMouseLeave } = useTooltip();
  const navigate = useNavigate();
  const { isBackgroundOn, setIsBackgroundOn } = useInboxZeroBackgroundContext();

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
  }, [selectedThread, scrollPosition]);

  const threadIds = useLiveQuery(() => {
    return db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .primaryKeys();
  });

  const messages = useLiveQuery(async () => {
    return db.messages
      .where("threadId")
      .anyOf(threadIds || [])
      .toArray();
  }, [threadIds]);

  const threadsList = useLiveQuery(
    () => {
      if (selectedTab.filterThreadsFnc)
        return selectedTab.filterThreadsFnc(selectedEmail);

      if (selectedTab.filterThreadsSearchFnc)
        return selectedTab.filterThreadsSearchFnc(
          selectedEmail,
          searchItems || [],
          messages || []
        );

      const emailThreads = db.emailThreads
        .where("email")
        .equals(selectedEmail.email)
        .and((thread) => thread.labelIds?.includes(selectedTab.folderId))
        .reverse()
        .sortBy("date");

      return emailThreads;
    },
    [selectedEmail, selectedTab, searchItems],
    [
      {
        id: "fake",
        historyId: "fake",
        email: "fake",
        from: "fake",
        subject: "fake",
        snippet: "fake",
        date: 304918904, // random number
        unread: false,
        labelIds: [],
        hasAttachments: false,
      },
    ]
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
    if (selectedTab.isSearchMode) {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !writeEmailMode) {
          navigate(-1);
        }
      };

      window.addEventListener("keydown", handleKeyPress);

      return () => {
        window.removeEventListener("keydown", handleKeyPress);
      };
    }
  });

  useEffect(() => {
    if (wrapperType && wrapperType === "HOME" && !writeEmailMode) {
      if (threadsList?.length === 0) {
        setIsBackgroundOn(true); // Show inbox zero background
      } else {
        setIsBackgroundOn(false);
      }
    } else {
      setIsBackgroundOn(false);
    }
  }, [threadsList, wrapperType, writeEmailMode, setIsBackgroundOn]);

  useEffect(() => {
    // Do not fetch on first render in any scenario. Cap the number of renders to prevent infinite loops on empty folders
    if (
      !selectedTab.isSearchMode &&
      renderCounter.current > 1 &&
      renderCounter.current < MAX_RENDER_COUNT
    ) {
      // If there are no threadsList in the db, do a full sync
      // TODO: Do a partial sync periodically to check for new threads (when not empty)
      if (threadsList?.length === 0) {
        void fullSync(selectedEmail.email, selectedEmail.provider, {
          folderId: selectedTab.folderId,
          gmailQuery: selectedTab.gmailQuery,
          outlookQuery: selectedTab.outlookQuery,
        });
      }
    }
  }, [selectedTab, selectedEmail, threadsList]);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    const startTime = new Date().getTime();

    // TODO: Partial sync if metadata, or else full sync
    await partialSync(selectedEmail.email, selectedEmail.provider, {
      folderId: selectedTab.folderId,
      gmailQuery: selectedTab.gmailQuery,
      outlookQuery: selectedTab.outlookQuery,
    });

    // If sync duration < MIN_REFRESH_DELAY_MS, wait until MIN_REFRESH_DELAY_MS has passed
    // Generally, this function will always take MIN_REFRESH_DELAY_MS
    const endTime = new Date().getTime();
    if (endTime - startTime < MIN_REFRESH_DELAY_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_REFRESH_DELAY_MS - (endTime - startTime))
      );
    }

    setRefreshing(false);
  };

  const handleSearchClick = () => {
    navigate("/search");
  };

  if (writeEmailMode) {
    return (
      <React.Fragment>
        <WriteMessage setWriteEmailMode={setWriteEmailMode} />
        {/* TODO: Create another Bar component for this that is more helpful for writing emails */}
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
          folderId={selectedTab.folderId}
        />
        <SelectedThreadBar
          thread={selectedThread}
          email={selectedEmail.email}
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
          <nav className="flex items-center pl-6" aria-label="Tabs">
            {selectedTab.isSearchMode ? (
              <h2
                key="Search"
                className={classNames(
                  "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                  "font-medium text-black dark:text-white"
                )}
              >
                Search
              </h2>
            ) : (
              tabs.map((tab) => (
                <h2
                  key={tab.title}
                  onClick={() => setSelectedTab(tab)}
                  className={
                    isBackgroundOn
                      ? classNames(
                          "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                          tab.title === selectedTab.title
                            ? "font-medium text-white"
                            : "text-white/50 hover:text-white hover:bg-black/50"
                        )
                      : classNames(
                          "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                          tab.title === selectedTab.title
                            ? "font-medium text-black dark:text-white"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-slate-100 dark:hover:bg-zinc-700"
                        )
                  }
                >
                  {tab.title}
                </h2>
              ))
            )}
          </nav>
          {selectedTab.isSearchMode ? (
            <SearchBar setSearchItems={setSearchItems || (() => void 0)} />
          ) : (
            <div className="flex items-center">
              <button
                className="mr-3"
                onMouseEnter={(event) => {
                  handleMouseEnter(event, "Compose");
                }}
                onMouseLeave={handleMouseLeave}
                onClick={() => {
                  setWriteEmailMode(true);
                }}
              >
                <PencilSquareIcon
                  className={classNames(
                    "h-5 w-5 shrink-0",
                    isBackgroundOn ? "text-white" : "text-black dark:text-white"
                  )}
                />
              </button>
              <button
                className="mr-3"
                onMouseEnter={(event) => {
                  handleMouseEnter(event, "Search");
                }}
                onMouseLeave={handleMouseLeave}
                onClick={handleSearchClick}
              >
                <MagnifyingGlassIcon
                  className={classNames(
                    "h-5 w-5 shrink-0",
                    isBackgroundOn ? "text-white" : "text-black dark:text-white"
                  )}
                />
              </button>
              <button
                className="mr-3"
                onMouseEnter={(event) => {
                  handleMouseEnter(event, "Refresh");
                }}
                onMouseLeave={handleMouseLeave}
                onClick={refreshing ? void 0 : handleRefreshClick}
              >
                <ArrowPathIcon
                  className={classNames(
                    "h-5 w-5 shrink-0",
                    isBackgroundOn
                      ? "text-white"
                      : "text-black dark:text-white",
                    refreshing ? "animate-spin" : ""
                  )}
                />
              </button>
              <AccountActionsMenu
                selectedEmail={selectedEmail}
                setSelectedEmail={(email) => void setSelectedEmail(email)}
                handleMouseEnter={handleMouseEnter}
                handleMouseLeave={handleMouseLeave}
              />

              <TooltipPopover
                message={tooltipData.message}
                showTooltip={tooltipData.showTooltip}
                coords={tooltipData.coords}
              />
            </div>
          )}
        </div>
        {process.env.NODE_ENV !== "production" ? (
          <TestSyncButtons
            folderId={selectedTab.folderId}
            gmailFetchQuery={selectedTab.gmailQuery}
            outlookFetchQuery={selectedTab.outlookQuery}
          />
        ) : null}
        <ThreadList
          selectedEmail={selectedEmail}
          threads={threads}
          setSelectedThread={setSelectedThread}
          setHoveredThread={setHoveredThread}
          setScrollPosition={setScrollPosition}
          scrollRef={scrollRef}
          folderId={selectedTab.folderId}
          canArchiveThread={selectedTab.canArchiveThread}
          canTrashThread={selectedTab.canTrashThread}
        />
      </div>
      <AssistBar thread={hoveredThread} setSelectedThread={setSelectedThread} />
    </React.Fragment>
  );
}
