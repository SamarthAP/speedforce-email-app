import { IEmailThread, ISelectedEmail, db } from "../lib/db";
import Titlebar from "../components/Titlebar";
import { ArrowSmallLeftIcon, StarIcon } from "@heroicons/react/20/solid";
import SelectedThreadBar from "../components/SelectedThreadBar";
import { useLiveQuery } from "dexie-react-hooks";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams } from "react-router-dom";
import Message from "../components/Message";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";
import { handleArchiveClick } from "../lib/asyncHelpers";
import { useMemo, useState } from "react";
import { KeyPressProvider } from "../contexts/KeyPressContext";
import { CommandBarOpenContext } from "../contexts/CommandBarContext";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";
import ShortcutsFloater from "../components/KeyboardShortcuts/ShortcutsFloater";
import toast from "react-hot-toast";
import CommandBar from "../components/CommandBar";

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
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_DOWN],
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ARROW_DOWN],
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
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ESCAPE],
    () => {
      if (!commandBarIsOpen) {
        navigate(originalPageUrl);
      }
    },
    [navigate, commandBarIsOpen]
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
                  title: "Email Commands",
                  commands: [
                    {
                      icon: StarIcon,
                      description: "Star",
                      action: () => {
                        // star thread
                        toast("Starred");
                      },
                      keybind: {
                        keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR]],
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
  const threadId = thread.id;

  const messages = useLiveQuery(() => {
    return db.messages
      .where("threadId")
      .equals(threadId || "")
      .sortBy("date");
  }, [threadId]);

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
        <div className="dark:text-white p-4 w-full">{thread?.subject}</div>
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
