import { IEmailThread, ISelectedEmail, db } from "../lib/db";
import Titlebar from "../components/Titlebar";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import {
  ArchiveBoxXMarkIcon,
  ArrowSmallLeftIcon,
} from "@heroicons/react/20/solid";
import SelectedThreadBar from "../components/SelectedThreadBar";
import { useLiveQuery } from "dexie-react-hooks";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams } from "react-router-dom";
import Message from "../components/Message";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";
import { handleArchiveClick, handleStarClick } from "../lib/asyncHelpers";
import { useMemo, useState } from "react";
import {
  KeyPressProvider,
  useKeyPressContext,
} from "../contexts/KeyPressContext";
import { CommandBarOpenContext } from "../contexts/CommandBarContext";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";
import ShortcutsFloater from "../components/KeyboardShortcuts/ShortcutsFloater";
import CommandBar from "../components/CommandBar";
import { getMessageHeader, listUnsubscribe } from "../lib/util";
import toast from "react-hot-toast";

interface GenericThreadFeedPageProps {
  selectedEmail: ISelectedEmail;
  navigationUrl: string;
  originalPageUrl: string;
  threads: IEmailThread[] | undefined;
}

export default function GenericThreadFeedPage({
  selectedEmail,
  navigationUrl,
  originalPageUrl,
  threads,
}: GenericThreadFeedPageProps) {
  const navigate = useNavigate();
  const { index } = useParams();
  const indexNumber = parseInt(index || "0"); // NOTE: use this for index
  const [commandBarIsOpen, setCommandBarIsOpen] = useState(false);

  const commandBarContextValue = useMemo(
    () => ({
      commandBarIsOpen: commandBarIsOpen,
      setCommandBarIsOpen: (isOpen: boolean) => setCommandBarIsOpen(isOpen),
    }),
    [commandBarIsOpen, setCommandBarIsOpen]
  );

  // mark thread as done
  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MARK_DONE],
    () => {
      if (threads) {
        void handleArchiveClick(
          threads[indexNumber],
          selectedEmail.email,
          selectedEmail.provider
        );
      }
    },
    [indexNumber, threads, selectedEmail.email, selectedEmail.provider]
  );

  // move hovered thread down
  useHotkeys(
    [
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_DOWN],
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ARROW_DOWN],
    ],
    () => {
      if (commandBarIsOpen) return;

      if (indexNumber <= -1) {
        navigate(`${navigationUrl}/0`);
      } else if (threads && indexNumber < threads.length - 1) {
        navigate(`${navigationUrl}/${indexNumber + 1}`);
      } else if (threads) {
        navigate(`${navigationUrl}/${threads.length - 1}`);
      }
    },
    [indexNumber, threads, navigate]
  );

  // move hovered thread up
  useHotkeys(
    [
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_UP],
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ARROW_UP],
    ],
    () => {
      if (commandBarIsOpen) return;

      if (indexNumber <= -1) {
        navigate(`${navigationUrl}/0`);
      } else if (indexNumber > 0) {
        navigate(`${navigationUrl}/${indexNumber - 1}`);
      } else if (threads) {
        navigate(`${navigationUrl}/0`);
      }
    },
    [indexNumber, threads, navigate]
  );

  useHotkeys(
    [
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.COMMAND] +
        "+" +
        DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.UNSUBSCRIBE],
    ],
    () => {
      if (!threads) return;

      const thread = threads[indexNumber];
      async function getUnsubscribeHeader() {
        const message = await db.messages
          .where("threadId")
          .equals(thread.id)
          .first();
        return getMessageHeader(message?.headers || [], "List-Unsubscribe");
      }

      void getUnsubscribeHeader().then((unsubscribeHeader) => {
        if (unsubscribeHeader) {
          void listUnsubscribe(
            unsubscribeHeader,
            selectedEmail.email,
            selectedEmail.provider
          );
        } else {
          toast.error("No unsubscribe link found");
        }
      });
    },
    [threads, selectedEmail.email, selectedEmail.provider, indexNumber]
  );

  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ESCAPE],
    () => {
      if (!commandBarIsOpen) {
        navigate(originalPageUrl);
      }
    },
    [navigate, commandBarIsOpen]
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

  if (threads === undefined) {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col dark:bg-zinc-900">
        <Titlebar />
      </div>
    );
  }

  if (threads.length === 0) {
    navigate(originalPageUrl);
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col dark:bg-zinc-900">
        <Titlebar />
        <div className="w-full h-full flex items-center justify-center text-xs text-slate-200 dark:text-zinc-700">
          No more emails
        </div>
      </div>
    );
  }

  // do checks for indexNumber
  if (indexNumber > threads.length - 1) {
    navigate(`${navigationUrl}/${threads.length - 1}`);
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col dark:bg-zinc-900">
        <Titlebar />
      </div>
    );
  }

  if (indexNumber < 0) {
    navigate(`${navigationUrl}/0`);
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col dark:bg-zinc-900">
        <Titlebar />
      </div>
    );
  }

  // some something if loading

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col dark:bg-zinc-900">
      <KeyPressProvider>
        <CommandBarOpenContext.Provider value={commandBarContextValue}>
          <GoToPageHotkeys>
            <Titlebar />
            <ThreadFeedSection
              thread={threads[indexNumber]}
              selectedEmail={selectedEmail}
              originalPageUrl={originalPageUrl}
            />
            <ShortcutsFloater
              items={[
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_DOWN]],
                  description: "Move Down",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_UP]],
                  description: "Move Up",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MARK_DONE]],
                  description: "Mark Done",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR]],
                  description: "Star",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SEARCH]],
                  description: "Search",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.COMPOSE]],
                  description: "Compose",
                },
                {
                  keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "s"],
                  isSequential: true,
                  description: "Go to Starred",
                },
              ]}
            />
            <CommandBar
              data={[
                {
                  title: "Email Actions",
                  commands: [
                    {
                      icon: ArchiveBoxXMarkIcon,
                      description: "Unsubscribe from email list",
                      action: () => {
                        const thread = threads[indexNumber];
                        async function getUnsubscribeHeader() {
                          const message = await db.messages
                            .where("threadId")
                            .equals(thread.id)
                            .first();
                          return getMessageHeader(
                            message?.headers || [],
                            "List-Unsubscribe"
                          );
                        }

                        void getUnsubscribeHeader().then(
                          (unsubscribeHeader) => {
                            if (unsubscribeHeader) {
                              void listUnsubscribe(
                                unsubscribeHeader,
                                selectedEmail.email,
                                selectedEmail.provider
                              );
                            } else {
                              toast.error("No unsubscribe link found");
                            }
                          }
                        );
                      },
                      keybind: {
                        keystrokes: [
                          "⌘",
                          DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.UNSUBSCRIBE],
                        ],
                        isSequential: false,
                      },
                    },
                  ],
                },
              ]}
            />
          </GoToPageHotkeys>
        </CommandBarOpenContext.Provider>
      </KeyPressProvider>
    </div>
  );
}

function ThreadFeedSection({
  thread,
  selectedEmail,
  originalPageUrl,
}: {
  thread: IEmailThread;
  selectedEmail: ISelectedEmail;
  originalPageUrl: string;
}) {
  const navigate = useNavigate();
  const { sequenceInitiated } = useKeyPressContext();
  const threadId = thread.id;

  const messages = useLiveQuery(() => {
    return db.messages
      .where("threadId")
      .equals(threadId || "")
      .sortBy("date");
  }, [thread]);

  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR],
    () => {
      if (!sequenceInitiated) {
        void handleStarClick(
          thread,
          selectedEmail.email,
          selectedEmail.provider
        );
      }
    },
    [thread, selectedEmail.email, selectedEmail.provider, sequenceInitiated]
  );

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* <Sidebar /> */}
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex px-4 pt-4">
          <div
            className="flex flex-row cursor-pointer items-center"
            onClick={(e) => {
              e.stopPropagation();
              navigate(originalPageUrl);
            }}
          >
            <ArrowSmallLeftIcon className="h-4 w-4 dark:text-zinc-400 text-slate-500" />
            <p className="dark:text-zinc-400 text-slate-500 text-xs px-1">
              Back
            </p>
          </div>
        </div>
        <div className="p-4 w-full flex justify-between">
          <div className="dark:text-white">{thread?.subject}</div>
          <div className="pl-2">
            {thread.labelIds.includes("STARRED") ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void handleStarClick(
                    thread,
                    selectedEmail.email,
                    selectedEmail.provider
                  );
                }}
              >
                <StarIconSolid className="h-4 w-4 text-yellow-400" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void handleStarClick(
                    thread,
                    selectedEmail.email,
                    selectedEmail.provider
                  );
                }}
              >
                <StarIconOutline className="h-4 w-4 dark:text-zinc-400 text-slate-500" />
              </button>
            )}
          </div>
        </div>
        <div className="h-full w-full flex flex-col space-y-2 px-4 pb-4 overflow-y-scroll hide-scroll">
          {messages?.map((message) => {
            return (
              <Message
                message={message}
                key={message.id}
                selectedEmail={selectedEmail}
              />
            );
          })}
        </div>
      </div>
      <SelectedThreadBar thread={threadId || ""} email={selectedEmail.email} />
    </div>
  );
}
