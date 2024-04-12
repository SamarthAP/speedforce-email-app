import { ISelectedEmail, db } from "../lib/db";
import Titlebar from "../components/Titlebar";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
import {
  ArchiveBoxXMarkIcon,
  ArrowSmallLeftIcon,
} from "@heroicons/react/20/solid";
import Message from "../components/Message";
import { useHotkeys } from "react-hotkeys-hook";
import SelectedThreadBar from "../components/SelectedThreadBar";
import {
  KeyPressProvider,
  useKeyPressContext,
} from "../contexts/KeyPressContext";
import { CommandBarOpenContext } from "../contexts/CommandBarContext";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";
import ShortcutsFloater from "../components/KeyboardShortcuts/ShortcutsFloater";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";
import CommandBar from "../components/CommandBar";
import { handleStarClick } from "../lib/asyncHelpers";
import { getMessageHeader, listUnsubscribe } from "../lib/util";
import { AccountBarOpenContext } from "../contexts/AccountBarContext";

interface ThreadPageProps {
  selectedEmail: ISelectedEmail;
}

export default function ThreadPage({ selectedEmail }: ThreadPageProps) {
  const navigate = useNavigate();
  const { sequenceInitiated } = useKeyPressContext();
  const { threadId } = useParams();
  const [commandBarIsOpen, setCommandBarIsOpen] = useState(false);
  const [accountBarIsOpen, setAccountBarIsOpen] = useState(false);

  const messages = useLiveQuery(() => {
    return db.messages
      .where("threadId")
      .equals(threadId || "")
      .sortBy("date");
  }, [threadId]);

  const listUnsubscribeHeader = messages?.length
    ? getMessageHeader(messages[0].headers, "List-Unsubscribe")
    : "";

  const thread = useLiveQuery(() => {
    return db.emailThreads.get(threadId || "");
  }, [threadId]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !commandBarIsOpen) {
        navigate(-1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate, commandBarIsOpen]);

  const commandBarContextValue = useMemo(
    () => ({
      commandBarIsOpen: commandBarIsOpen,
      setCommandBarIsOpen: (isOpen: boolean) => setCommandBarIsOpen(isOpen),
    }),
    [commandBarIsOpen, setCommandBarIsOpen]
  );

  const accountBarContextValue = useMemo(
    () => ({
      accountBarIsOpen: accountBarIsOpen,
      setAccountBarIsOpen: (isOpen: boolean) => setAccountBarIsOpen(isOpen),
    }),
    [accountBarIsOpen, setAccountBarIsOpen]
  );

  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR],
    () => {
      if (thread && !sequenceInitiated) {
        void handleStarClick(
          thread,
          selectedEmail.email,
          selectedEmail.provider
        );
      }
    },
    [thread, selectedEmail.email, selectedEmail.provider, sequenceInitiated]
  );

  useHotkeys(
    [
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.COMMAND] +
        "+" +
        DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.UNSUBSCRIBE],
    ],
    () => {
      if (listUnsubscribeHeader) {
        void listUnsubscribe(
          listUnsubscribeHeader,
          selectedEmail.email,
          selectedEmail.provider
        );
      }
    },
    [selectedEmail.email, selectedEmail.provider, listUnsubscribeHeader]
  );

  const unsubscribeFromList = () => {
    if (listUnsubscribeHeader) {
      void listUnsubscribe(
        listUnsubscribeHeader,
        selectedEmail.email,
        selectedEmail.provider
      );
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col dark:bg-zinc-900">
      <KeyPressProvider>
        <CommandBarOpenContext.Provider value={commandBarContextValue}>
          <AccountBarOpenContext.Provider value={accountBarContextValue}>
            <GoToPageHotkeys>
              <Titlebar />
              <div className="w-full h-full flex overflow-hidden">
                {/* <Sidebar /> */}
                <div className="w-full h-full flex flex-col overflow-hidden">
                  <div className="flex px-4 pt-4">
                    <div
                      className="flex flex-row cursor-pointer items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(-1);
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
                      {thread ? (
                        thread.labelIds.includes("STARRED") ? (
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
                        )
                      ) : null}
                    </div>
                  </div>
                  <div className="h-full w-full flex flex-col space-y-2 px-4 pb-4 overflow-y-scroll hide-scroll">
                    {messages?.map((message, idx) => {
                      return (
                        <Message
                          message={message}
                          key={message.id}
                          selectedEmail={selectedEmail}
                          isLast={idx === messages.length - 1}
                        />
                      );
                    })}
                  </div>
                </div>
                <SelectedThreadBar
                  thread={threadId || ""}
                  email={selectedEmail.email}
                />
              </div>
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
                    keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR]],
                    description: "Star",
                  },
                  {
                    keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SELECT]],
                    description: "View Thread",
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
                data={
                  listUnsubscribeHeader
                    ? [
                        {
                          title: "Email Actions",
                          commands: [
                            {
                              icon: ArchiveBoxXMarkIcon,
                              description: "Unsubscribe from email list",
                              action: () => {
                                unsubscribeFromList();
                              },
                              keybind: {
                                keystrokes: [
                                  "⌘",
                                  DEFAULT_KEYBINDS[
                                    KEYBOARD_ACTIONS.UNSUBSCRIBE
                                  ],
                                ],
                                isSequential: false,
                              },
                            },
                          ],
                        },
                      ]
                    : []
                }
              />
            </GoToPageHotkeys>
          </AccountBarOpenContext.Provider>
        </CommandBarOpenContext.Provider>
      </KeyPressProvider>
    </div>
  );
}
