import ThreadList from "../ThreadList";
import Sidebar from "../Sidebar";
import { IEmail, IEmailThread, db } from "../../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEmailPageOutletContext } from "../../pages/_emailPage";
import AssistBar from "../AssistBar";
import AccountActionsMenu from "../AccountActionsMenu";
import {
  PencilSquareIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import TooltipPopover from "../TooltipPopover";
import { useTooltip } from "../UseTooltip";
import { classNames } from "../../lib/util";
import {
  ClientInboxTabType,
  ClientTabNavigationType,
} from "../../api/model/client.inbox";
import { useNavigate } from "react-router-dom";
import {
  FetchNextPageOptions,
  InfiniteData,
  InfiniteQueryObserverResult,
} from "react-query";
import Titlebar from "../Titlebar";
import PersonalAI from "../AI/PersonalAI";
import { HoveredThreadContext } from "../../contexts/HoveredThreadContext";

interface ThreadViewProps {
  data: ClientInboxTabType;
  tabs?: ClientTabNavigationType[];
  fetchNextPage: (
    options?: FetchNextPageOptions | undefined
  ) => Promise<InfiniteQueryObserverResult<string | undefined, unknown>>;
  hasNextPage: boolean | undefined;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  reactQueryData: InfiniteData<string | undefined> | undefined;
}

export default function ThreadView({
  data,
  tabs,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  reactQueryData,
}: ThreadViewProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const [hoveredThreadIndex, setHoveredThreadIndex] = useState<number>(-1);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const navigate = useNavigate();
  const [showPersonalAi, setShowPersonalAi] = useState(false);

  const renderCounter = useRef(0);
  renderCounter.current = renderCounter.current + 1;

  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (
      (scrollTop >= (scrollHeight - clientHeight) / 2 ||
        scrollHeight <= clientHeight) &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetching
    ) {
      void fetchNextPage();
    }
  };

  useEffect(() => {
    const fetchEmailsIfScreenIsNotFilled = () => {
      if (scrollRef.current) {
        const { clientHeight, scrollHeight } = scrollRef.current;

        if (
          scrollHeight <= clientHeight &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isFetching
        ) {
          void fetchNextPage();
        }
      }
    };
    // fetches emails if the screen is not filled
    fetchEmailsIfScreenIsNotFilled();
  }, [
    reactQueryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  ]);

  const threads = useLiveQuery(
    () => {
      if (data.filterThreadsFnc) return data.filterThreadsFnc(selectedEmail);

      return [];
    },
    [selectedEmail, data, navigate],
    []
  );

  const handleSearchClick = () => {
    navigate("/search");
  };

  const setSelectedEmail = async (email: IEmail) => {
    await db.selectedEmail.put({
      id: 1,
      email: email.email,
      provider: email.provider,
      inboxZeroStartDate: email.inboxZeroStartDate,
    });
  };

  const hoveredThreadContextValue = useMemo(
    () => ({
      threadIndex: hoveredThreadIndex,
      setThreadIndex: (index: number) => void setHoveredThreadIndex(index),
    }),
    [hoveredThreadIndex, setHoveredThreadIndex]
  );

  return (
    <div className={`overflow-hidden h-screen w-screen flex flex-col`}>
      <Titlebar />
      <PersonalAI show={showPersonalAi} hide={() => setShowPersonalAi(false)} />

      <div className="w-full h-full flex overflow-hidden">
        <Sidebar />
        <div className="w-full h-full flex flex-col">
          <div className="flex flex-row items-center justify-between">
            <nav className="flex items-center pl-6" aria-label="Tabs">
              {tabs ? (
                tabs.map((tab) => (
                  <h2
                    key={tab.title}
                    onClick={() => navigate(tab.href)}
                    className={classNames(
                      "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                      tab.title === data.title
                        ? "font-medium text-black dark:text-white"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-slate-100 dark:hover:bg-zinc-700"
                    )}
                  >
                    {tab.title}
                  </h2>
                ))
              ) : (
                <h2
                  className={classNames(
                    "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                    "font-medium text-black dark:text-white"
                  )}
                >
                  {data.title}
                </h2>
              )}
            </nav>
            <div className="flex items-center">
              {selectedEmail.provider === "google" && (
                <button
                  className="mr-3"
                  onMouseEnter={(event) => {
                    handleShowTooltip(event, "AI");
                  }}
                  onMouseLeave={handleHideTooltip}
                  onClick={() => {
                    setShowPersonalAi(true);
                  }}
                >
                  <SparklesIcon
                    className={classNames(
                      "h-5 w-5 shrink-0",
                      "text-black dark:text-white"
                    )}
                  />
                </button>
              )}
              <button
                className="mr-3"
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Compose");
                }}
                onMouseLeave={handleHideTooltip}
                onClick={() => {
                  navigate("/compose");
                }}
              >
                <PencilSquareIcon
                  className={classNames(
                    "h-5 w-5 shrink-0",
                    "text-black dark:text-white"
                  )}
                />
              </button>
              <button
                className="mr-3"
                onMouseEnter={(event) => {
                  handleShowTooltip(event, "Search");
                }}
                onMouseLeave={handleHideTooltip}
                onClick={handleSearchClick}
              >
                <MagnifyingGlassIcon
                  className={classNames(
                    "h-5 w-5 shrink-0",
                    "text-black dark:text-white"
                  )}
                />
              </button>
              <AccountActionsMenu
                selectedEmail={selectedEmail}
                setSelectedEmail={(email) => void setSelectedEmail(email)}
                handleShowtooltip={handleShowTooltip}
                handleHideTooltip={handleHideTooltip}
              />

              <TooltipPopover
                message={tooltipData.message}
                showTooltip={tooltipData.showTooltip}
                coords={tooltipData.coords}
              />
            </div>
          </div>
          <HoveredThreadContext.Provider value={hoveredThreadContextValue}>
            <ThreadList
              selectedEmail={selectedEmail}
              threads={threads}
              setScrollPosition={setScrollPosition}
              handleScroll={handleScroll}
              scrollRef={scrollRef}
              canArchiveThread={data.canArchiveThread}
              canTrashThread={data.canTrashThread}
              canPermanentlyDeleteThread={data.canDeletePermanentlyThread}
              isDrafts={data.isDraftMode}
            />
          </HoveredThreadContext.Provider>
        </div>
        <AssistBar thread={threads[hoveredThreadIndex]} />
      </div>
    </div>
  );
}
