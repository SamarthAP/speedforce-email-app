import ThreadList from "../ThreadList";
import Sidebar from "../Sidebar";
import { IEmail, db } from "../../lib/db";
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
import { useHotkeys } from "react-hotkeys-hook";
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
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../../lib/shortcuts";
import { markRead } from "../../lib/sync";
import { handleStarClick } from "../../lib/asyncHelpers";
import { useCommandBarOpenContext } from "../../contexts/CommandBarContext";
import { useKeyPressContext } from "../../contexts/KeyPressContext";
import CommandBar from "../CommandBar";
import { useDebounceCallback } from "usehooks-ts";
import { DisableMouseHoverContext } from "../../contexts/DisableMouseHoverContext";
import AccountBar from "../AccountBar";
import { newEvent } from "../../api/emailActions";

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
  const { commandBarIsOpen } = useCommandBarOpenContext();
  const [hoveredThreadIndex, setHoveredThreadIndex] = useState<number>(-1);
  const { sequenceInitiated } = useKeyPressContext();
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const navigate = useNavigate();
  const [showPersonalAi, setShowPersonalAi] = useState(false);
  const [disableMouseHover, setDisableMouseHover] = useState(false);
  const disableMouseHoverContextValue = {
    disableMouseHover,
    setDisableMouseHover,
  };

  const debouncedDisableMouseHover = useDebounceCallback(
    setDisableMouseHover,
    300
  );

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

  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.COMPOSE],
    () => {
      navigate("/compose");
    },
    [navigate]
  );

  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SEARCH],
    () => {
      navigate("/search");
    },
    [navigate]
  );

  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR],
    () => {
      if (hoveredThreadIndex > -1 && !sequenceInitiated) {
        void handleStarClick(
          threads[hoveredThreadIndex],
          selectedEmail.email,
          selectedEmail.provider
        );
      }
    },
    [
      hoveredThreadIndex,
      threads,
      selectedEmail.email,
      selectedEmail.provider,
      sequenceInitiated,
    ]
  );

  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SELECT],
    () => {
      if (commandBarIsOpen) return;

      if (hoveredThreadIndex > -1) {
        const thread = threads[hoveredThreadIndex];
        if (thread.unread) {
          void markRead(selectedEmail.email, selectedEmail.provider, thread.id);
        }

        navigate(`/thread/${thread.id}`);
      }
    },
    [
      hoveredThreadIndex,
      threads,
      selectedEmail.email,
      selectedEmail.provider,
      commandBarIsOpen,
      navigate,
    ]
  );

  // move hovered thread down
  useHotkeys(
    [
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_DOWN],
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ARROW_DOWN],
    ],
    () => {
      if (commandBarIsOpen) return;

      setHoveredThreadIndex((prev) => {
        if (prev <= -1) {
          return 0;
        } else if (prev < threads.length - 1) {
          setDisableMouseHover(true);
          debouncedDisableMouseHover(false);
          return prev + 1;
        } else {
          return threads.length - 1;
        }
      });
    },
    [threads, commandBarIsOpen, setHoveredThreadIndex]
  );

  // move hovered thread up
  useHotkeys(
    [
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_UP],
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ARROW_UP],
    ],
    () => {
      if (commandBarIsOpen) return;

      setHoveredThreadIndex((prev) => {
        if (prev <= -1) {
          return 0;
        } else if (prev > 0) {
          setDisableMouseHover(true);
          debouncedDisableMouseHover(false);
          return prev - 1;
        } else {
          return 0;
        }
      });
    },
    [threads, commandBarIsOpen, setHoveredThreadIndex]
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
                    void newEvent(selectedEmail.provider, "OPEN_PERSONAL_AI", {
                      from: "click",
                    });
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
            <DisableMouseHoverContext.Provider
              value={disableMouseHoverContextValue}
            >
              <ThreadList
                selectedEmail={selectedEmail}
                threads={threads}
                setScrollPosition={setScrollPosition}
                handleScroll={handleScroll}
                scrollRef={scrollRef}
                canArchiveThread={data.canArchiveThread}
                canTrashThread={data.canTrashThread}
                canPermanentlyDeleteThread={data.canDeletePermanentlyThread}
                isSent={data.isSentMode}
              />
            </DisableMouseHoverContext.Provider>
          </HoveredThreadContext.Provider>
        </div>
        <AssistBar />
      </div>
      <CommandBar
        data={[]}
        // data={[
        //   {
        //     title: "Email Commands",
        //     commands: [
        //       {
        //         icon: StarIcon,
        //         description: "Star",
        //         action: () => {
        //           // star thread
        //           toast("Starred");
        //         },
        //         keybind: {
        //           keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR]],
        //           isSequential: false,
        //         },
        //       },
        //     ],
        //   },
        // ]}
      />
      <AccountBar />
    </div>
  );
}
