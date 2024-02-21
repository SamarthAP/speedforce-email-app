import ThreadList from "../ThreadList";
import Sidebar from "../Sidebar";
import { IEmail, IEmailThread, db } from "../../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { InboxZeroBackgroundContext } from "../../contexts/InboxZeroBackgroundContext";
import Titlebar from "../Titlebar";
import { useEmailPageOutletContext } from "../../pages/_emailPage";
import {
  FetchNextPageOptions,
  InfiniteData,
  InfiniteQueryObserverResult,
} from "react-query";
import PersonalAI from "../AI/PersonalAI";
import { handleArchiveClick, handleStarClick } from "../../lib/asyncHelpers";
import { markRead } from "../../lib/sync";
import { useHotkeys } from "react-hotkeys-hook";
import { HoveredThreadContext } from "../../contexts/HoveredThreadContext";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../../lib/shortcuts";

interface InboxThreadViewProps {
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

export default function InboxThreadView({
  data,
  tabs,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  reactQueryData,
}: InboxThreadViewProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const [hoveredThread, setHoveredThread] = useState<IEmailThread | null>(null);
  const [hoveredThreadIndex, setHoveredThreadIndex] = useState<number>(-1);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const dailyImageMetadata = useLiveQuery(() => db.dailyImageMetadata.get(1));
  const [isBackgroundOn, setIsBackgroundOn] = useState(false);
  const backgroundImageUrl = dailyImageMetadata ? dailyImageMetadata.url : ""; // TODO: load somewhere else
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const navigate = useNavigate();
  const [showPersonalAi, setShowPersonalAi] = useState(false);

  const renderCounter = useRef(0);
  renderCounter.current = renderCounter.current + 1;

  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;

    // if 10 pixels from the bottom of the page, fetch next page
    // if (
    //   scrollTop + clientHeight >= scrollHeight - 10 &&
    //   hasNextPage &&
    //   !isFetchingNextPage
    // ) {
    //   // void fetchNextPage();
    //   console.log("fetching next page");
    // }

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

  useEffect(() => {
    // fetches emails if the screen is not filled
    fetchEmailsIfScreenIsNotFilled();
  }, [reactQueryData]);

  // useEffect(() => {
  //   if (scrollRef.current) {
  //     const divVisibleHeight = scrollRef.current.clientHeight;
  //     const divScrollHeight = scrollRef.current.scrollHeight;
  //     const maxScroll = divScrollHeight - divVisibleHeight;

  //     if (scrollPosition > maxScroll) {
  //       setScrollPosition(maxScroll);
  //     }

  //     scrollRef.current.scrollTo(0, scrollPosition);
  //   }
  // }, [scrollPosition]);

  const threadsList = useLiveQuery(
    () => {
      if (data.filterThreadsFnc) return data.filterThreadsFnc(selectedEmail);

      return [];
    },
    [selectedEmail, data],
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
      thread: hoveredThread,
      setThread: (thread: IEmailThread | null) => void setHoveredThread(thread),
      threadIndex: hoveredThreadIndex,
      setThreadIndex: (index: number) => void setHoveredThreadIndex(index),
    }),
    [hoveredThread, setHoveredThread, hoveredThreadIndex, setHoveredThreadIndex]
  );

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

  // mark hovered thread as done
  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MARK_DONE],
    () => {
      if (hoveredThreadIndex > -1) {
        void handleArchiveClick(
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
        navigate(
          `/${
            data.title === "Important"
              ? "importantThreadFeed"
              : "otherThreadFeed"
          }/${hoveredThreadIndex}`
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
    <div
      className={`overflow-hidden h-screen w-screen flex flex-col bg-cover bg-center ${
        isBackgroundOn && backgroundImageUrl ? "fadeIn-animation" : ""
      }`}
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
      <PersonalAI show={showPersonalAi} hide={() => setShowPersonalAi(false)} />
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
                      className={
                        isBackgroundOn
                          ? classNames(
                              "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                              tab.title === data.title
                                ? "font-medium text-white"
                                : "text-white/50 hover:text-white hover:bg-black/50"
                            )
                          : classNames(
                              "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                              tab.title === data.title
                                ? "font-medium text-black dark:text-white"
                                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-slate-100 dark:hover:bg-zinc-700"
                            )
                      }
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
                        isBackgroundOn
                          ? "text-white"
                          : "text-black dark:text-white"
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
                      isBackgroundOn
                        ? "text-white"
                        : "text-black dark:text-white"
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
                      isBackgroundOn
                        ? "text-white"
                        : "text-black dark:text-white"
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
                navigateToFeed={
                  data.title === "Important"
                    ? "/importantThreadFeed"
                    : "/otherThreadFeed"
                }
              />
            </HoveredThreadContext.Provider>
          </div>
          <AssistBar thread={threads[hoveredThreadIndex]} />
        </div>
      </InboxZeroBackgroundContext.Provider>
    </div>
  );
}
