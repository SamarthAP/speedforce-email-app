import { useEffect, useMemo, useState } from "react";
import PersonalAI from "../AI/PersonalAI";
import Sidebar from "../Sidebar";
import Titlebar from "../Titlebar";
import { classNames } from "../../lib/util";
import { IEmail, db } from "../../lib/db";
import { useTooltip } from "../UseTooltip";
import {
  PencilSquareIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import AccountActionsMenu from "../AccountActionsMenu";
import TooltipPopover from "../TooltipPopover";
import AssistBar from "../AssistBar";
import { SharedDraftThreadList } from "../SharedDrafts/ThreadList";
import { listSharedDrafts } from "../../api/drafts";
import { useHotkeys } from "react-hotkeys-hook";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../../lib/shortcuts";
import { useCommandBarOpenContext } from "../../contexts/CommandBarContext";
import { HoveredThreadContext } from "../../contexts/HoveredThreadContext";
import { useEmailPageOutletContext } from "../../pages/_emailPage";
import CommandBar from "../CommandBar";
import { useDebounceCallback } from "usehooks-ts";
import { DisableMouseHoverContext } from "../../contexts/DisableMouseHoverContext";
import { newEvent } from "../../api/emailActions";

export default function SharedDraftsThreadView() {
  const { selectedEmail } = useEmailPageOutletContext();
  const [showPersonalAi, setShowPersonalAi] = useState(false);
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<
    {
      id: string;
      from: string;
      subject: string;
      to: string;
      cc: string;
      bcc: string;
      date: number;
      html: string;
    }[]
  >([]);
  const { commandBarIsOpen } = useCommandBarOpenContext();
  const [hoveredThreadIndex, setHoveredThreadIndex] = useState<number>(-1);
  const [disableMouseHover, setDisableMouseHover] = useState(false);
  const disableMouseHoverContextValue = {
    disableMouseHover,
    setDisableMouseHover,
  };

  const debouncedDisableMouseHover = useDebounceCallback(
    setDisableMouseHover,
    300
  );

  useHotkeys(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.COMPOSE], () => {
    navigate("/compose");
  });

  useHotkeys(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SEARCH], () => {
    navigate("/search");
  });

  // move hovered thread down
  useHotkeys(
    [
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_DOWN],
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ARROW_DOWN],
    ],
    () => {
      if (!commandBarIsOpen) {
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
      }
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
      if (!commandBarIsOpen) {
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
      }
    },
    [threads, commandBarIsOpen, setHoveredThreadIndex]
  );

  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SELECT],
    () => {
      if (!commandBarIsOpen) {
        if (hoveredThreadIndex > -1) {
          const thread = threads[hoveredThreadIndex];

          navigate(`/sharedDraft/${thread.id}`);
        }
      }
    },
    [
      hoveredThreadIndex,
      threads,
      selectedEmail.email,
      selectedEmail.provider,
      commandBarIsOpen,
    ]
  );

  const hoveredThreadContextValue = useMemo(
    () => ({
      threadIndex: hoveredThreadIndex,
      setThreadIndex: (index: number) => void setHoveredThreadIndex(index),
    }),
    [hoveredThreadIndex, setHoveredThreadIndex]
  );

  useEffect(() => {
    const getSharedDrafts = async () => {
      const { data, error } = await listSharedDrafts(selectedEmail.email);
      if (error) {
        return;
      }

      setThreads(data);
    };

    void getSharedDrafts();
  }, [selectedEmail.email]);

  const setSelectedEmail = async (email: IEmail) => {
    await db.selectedEmail.put({
      id: 1,
      email: email.email,
      provider: email.provider,
      inboxZeroStartDate: email.inboxZeroStartDate,
    });
  };

  const handleSearchClick = () => {
    navigate("/search");
  };

  return (
    <div className="overflow-hidden h-screen w-screen flex flex-col">
      <Titlebar />
      <PersonalAI show={showPersonalAi} hide={() => setShowPersonalAi(false)} />

      <div className="w-full h-full flex overflow-hidden">
        <Sidebar />
        <div className="w-full h-full flex flex-col">
          <div className="flex flex-row items-center justify-between">
            <nav className="flex items-center pl-6">
              <h2
                className={classNames(
                  "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                  "font-medium text-black dark:text-white"
                )}
              >
                Shared With Me
              </h2>
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
              <SharedDraftThreadList threads={threads} />
            </DisableMouseHoverContext.Provider>
          </HoveredThreadContext.Provider>
        </div>
        <AssistBar />
      </div>
      <CommandBar data={[]} />
    </div>
  );
}
