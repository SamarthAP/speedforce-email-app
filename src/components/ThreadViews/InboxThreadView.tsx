import ThreadList from "../ThreadList";
import Sidebar from "../Sidebar";
import { IEmail, IEmailThread, ISelectedEmail, db } from "../../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ThreadFeed } from "../ThreadFeed";
import AssistBar from "../AssistBar";
import AccountActionsMenu from "../AccountActionsMenu";
import { fullSync, partialSync } from "../../lib/sync";
import { PencilSquareIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
// import { WriteMessage } from "../WriteMessage";
import SelectedThreadBar from "../SelectedThreadBar";
import TooltipPopover from "../TooltipPopover";
import { useTooltip } from "../UseTooltip";
import { classNames } from "../../lib/util";
import { ClientInboxTabType } from "../../api/model/client.inbox";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useNavigate } from "react-router-dom";
import { InboxZeroBackgroundContext } from "../../contexts/InboxZeroBackgroundContext";
import Titlebar from "../Titlebar";
import { useEmailPageOutletContext } from "../../pages/_emailPage";

const MAX_RENDER_COUNT = 5;
const MIN_REFRESH_DELAY_MS = 1000;

interface InboxThreadViewProps {
  tabs: ClientInboxTabType[];
  // selectedEmail: ISelectedEmail;
}

export default function InboxThreadView({
  tabs,
}: // selectedEmail,
InboxThreadViewProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const [selectedTab, setSelectedTab] = useState<ClientInboxTabType>(tabs[0]);
  const [hoveredThread, setHoveredThread] = useState<IEmailThread | null>(null);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const dailyImageMetadata = useLiveQuery(() => db.dailyImageMetadata.get(1));
  const [isBackgroundOn, setIsBackgroundOn] = useState(false);
  const backgroundImageUrl = dailyImageMetadata ? dailyImageMetadata.url : ""; // TODO: load somewhere else
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tooltipData, handleMouseEnter, handleMouseLeave } = useTooltip();
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

  const threadsList = useLiveQuery(
    () => {
      if (selectedTab.filterThreadsFnc)
        return selectedTab.filterThreadsFnc(selectedEmail);

      const emailThreads = db.emailThreads
        .where("email")
        .equals(selectedEmail.email)
        .and((thread) => thread.labelIds?.includes(selectedTab.folderId))
        .reverse()
        .sortBy("date");

      return emailThreads;
    },
    [selectedEmail, selectedTab],
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
    if (threadsList?.length === 0) {
      setIsBackgroundOn(true); // Show inbox zero background
    } else {
      setIsBackgroundOn(false);
    }
  }, [threadsList, setIsBackgroundOn]);

  useEffect(() => {
    // Do not fetch on first render in any scenario. Cap the number of renders to prevent infinite loops on empty folders
    if (
      // !selectedTab.isSearchMode &&
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

  const setSelectedEmail = async (email: IEmail) => {
    await db.selectedEmail.put({
      id: 1,
      email: email.email,
      provider: email.provider,
      inboxZeroStartDate: email.inboxZeroStartDate,
    });
  };

  return (
    <div
      className={`h-screen w-screen fadeIn-animation bg-cover bg-center`}
      style={
        isBackgroundOn && backgroundImageUrl
          ? {
              backgroundImage: "url(" + backgroundImageUrl + ")",
            }
          : {
              backgroundColor: "transparent",
            }
      }
    >
      {isBackgroundOn && (
        <>
          <div className="absolute h-[100px] w-screen inset-0 bg-gradient-to-b from-black/50 to-transparent pointer-events-none"></div>
          <div className="absolute h-[50px] w-screen bottom-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
          <div className="absolute h-screen w-[90px] left-0 inset-0 bg-gradient-to-r from-black/50 to-transparent pointer-events-none"></div>
          <div className="absolute z-10 bottom-4 left-1/2 -translate-x-1/2 text-white/75 text-sm font-medium">
            Congrats! You&apos;ve reached Inbox Zero{" "}
            <span
              className="text-transparent"
              style={{
                textShadow: "0 0 0 rgb(255 255 255 / 0.75)",
              }}
            >
              🔥
            </span>
          </div>
        </>
      )}
      <InboxZeroBackgroundContext.Provider
        value={{
          isBackgroundOn,
          setIsBackgroundOn,
        }}
      >
        <Titlebar />
        <div className="flex h-full overflow-hidden">
          <Sidebar />
          <div className="w-full flex flex-col overflow-hidden">
            <div className="flex flex-row items-center justify-between">
              <nav className="flex items-center pl-6" aria-label="Tabs">
                {tabs.map((tab) => (
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
                ))}
              </nav>
              <div className="flex items-center">
                <button
                  className="mr-3"
                  onMouseEnter={(event) => {
                    handleMouseEnter(event, "Compose");
                  }}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    navigate("/compose");
                    // setWriteEmailMode(true);
                  }}
                >
                  <PencilSquareIcon
                    className={classNames(
                      "h-5 w-5 shrink-0",
                      isBackgroundOn
                        ? "text-white"
                        : "text-black dark:text-white"
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
                      isBackgroundOn
                        ? "text-white"
                        : "text-black dark:text-white"
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
            </div>
            <ThreadList
              selectedEmail={selectedEmail}
              threads={threads}
              setHoveredThread={setHoveredThread}
              setScrollPosition={setScrollPosition}
              scrollRef={scrollRef}
              folderId={selectedTab.folderId}
              canArchiveThread={selectedTab.canArchiveThread}
              canTrashThread={selectedTab.canTrashThread}
              canPermanentlyDeleteThread={
                selectedTab.canDeletePermanentlyThread
              }
            />
          </div>
          <AssistBar thread={hoveredThread} />
        </div>
      </InboxZeroBackgroundContext.Provider>
    </div>
  );
}
