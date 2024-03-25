import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Transition } from "@headlessui/react";
import { LightBulbIcon } from "../lib/icons";
import { useNavigate } from "react-router-dom";
import {
  ArchiveBoxIcon,
  ClipboardDocumentIcon,
  ExclamationCircleIcon,
  InboxIcon,
  PaperAirplaneIcon,
  StarIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";
import { useHotkeys } from "react-hotkeys-hook";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";
import {
  HoveredCommandBarItemContext,
  useCommandBarOpenContext,
  useHoveredCommandBarItemContext,
} from "../contexts/CommandBarContext";
import {
  DisableMouseHoverContext,
  useDisableMouseHoverContext,
} from "../contexts/DisableMouseHoverContext";
import { useDebounceCallback } from "usehooks-ts";

interface CommandBarGroupData {
  title: string;
  commands: {
    icon: React.ElementType;
    description: string;
    action: () => void;
    keybind: {
      keystrokes: string[];
      isSequential?: boolean;
    };
  }[];
}

interface CommandBarProps {
  data: CommandBarGroupData[];
}

export default function CommandBar({ data }: CommandBarProps) {
  const [open, setOpen] = useState(false);
  const commandBarContext = useCommandBarOpenContext();
  const [hoveredCommandBarItemId, setHoveredCommandBarItemId] = useState("");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [shortcutsFloaterVisible, setShortcutsFloaterVisible] = useState(() => {
    const isVisible = localStorage.getItem("shortcutsFloaterVisible");

    if (isVisible === "true") {
      return true;
    }

    return false;
  });
  const [disableMouseHover, setDisableMouseHover] = useState(false);
  const disableMouseHoverContextValue = {
    disableMouseHover,
    setDisableMouseHover,
  };

  useEffect(() => {
    if (open) {
      commandBarContext.setCommandBarIsOpen(true);
    } else {
      commandBarContext.setCommandBarIsOpen(false);
    }
  }, [open, commandBarContext]);

  const hoveredCommadBarItemContextValue = useMemo(
    () => ({
      itemId: hoveredCommandBarItemId,
      setItemId: (id: string) => void setHoveredCommandBarItemId(id),
    }),
    [hoveredCommandBarItemId, setHoveredCommandBarItemId]
  );

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      const visible = localStorage.getItem("shortcutsFloaterVisible");
      setShortcutsFloaterVisible(visible === "true");
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const debouncedDisableMouseHover = useDebounceCallback(
    setDisableMouseHover,
    300
  );

  const defaultData: CommandBarGroupData[] = [
    {
      title: "Navigation",
      commands: [
        {
          icon: InboxIcon,
          description: "Go To Important",
          action: () => {
            navigate("/");
          },
          keybind: {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "i"],
            isSequential: true,
          },
        },
        {
          icon: InboxIcon,
          description: "Go To Other",
          action: () => {
            navigate("/other");
          },
          keybind: {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "o"],
            isSequential: true,
          },
        },
        {
          icon: StarIcon,
          description: "Go To Starred",
          action: () => {
            navigate("/starred");
          },
          keybind: {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "s"],
            isSequential: true,
          },
        },
        {
          icon: PaperAirplaneIcon,
          description: "Go To Sent",
          action: () => {
            navigate("/sent");
          },
          keybind: {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "t"],
            isSequential: true,
          },
        },
        {
          icon: ClipboardDocumentIcon,
          description: "Go To Drafts",
          action: () => {
            navigate("/drafts");
          },
          keybind: {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "d"],
            isSequential: true,
          },
        },
        {
          icon: ArchiveBoxIcon,
          description: "Go To Done",
          action: () => {
            navigate("/done");
          },
          keybind: {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "e"],
            isSequential: true,
          },
        },
        {
          icon: ExclamationCircleIcon,
          description: "Go To Spam",
          action: () => {
            navigate("/spam");
          },
          keybind: {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "!"],
            isSequential: true,
          },
        },
        {
          icon: TrashIcon,
          description: "Go To Deleted",
          action: () => {
            navigate("/deleted");
          },
          keybind: {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "#"],
            isSequential: true,
          },
        },
        {
          icon: UserGroupIcon,
          description: "Go To Shared Drafts",
          action: () => {
            navigate("/sharedDrafts");
          },
          keybind: {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "$"],
            isSequential: true,
          },
        },
      ],
    },
    {
      title: "Help",
      commands: [
        {
          icon: LightBulbIcon,
          description: shortcutsFloaterVisible
            ? "Hide keyboard shortcut hints"
            : "Show keyboard shortcut hints",
          action: () => {
            if (shortcutsFloaterVisible) {
              localStorage.setItem("shortcutsFloaterVisible", "false");
              window.dispatchEvent(new StorageEvent("storage"));
            } else {
              localStorage.setItem("shortcutsFloaterVisible", "true");
              window.dispatchEvent(new StorageEvent("storage"));
            }
          },
          keybind: {
            keystrokes: ["Shift", "/"],
            isSequential: false,
          },
        },
      ],
    },
  ];

  const mergedData = [...defaultData, ...data];

  let filteredData = mergedData;

  if (search) {
    filteredData = [];

    for (let i = 0; i < mergedData.length; i++) {
      const group = mergedData[i];

      if (group.title.toLowerCase().includes(search.toLowerCase()))
        filteredData.push(group);

      const filteredCommands = group.commands.filter((command) =>
        command.description.toLowerCase().includes(search.toLowerCase())
      );

      if (filteredCommands.length > 0) {
        filteredData.push({
          title: group.title,
          commands: filteredCommands,
        });
      }
    }
  }

  useHotkeys(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SELECT],
    () => {
      if (!commandBarContext.commandBarIsOpen) return;

      let hoveredItem = null;

      for (let i = 0; i < filteredData.length; i++) {
        const group = filteredData[i];

        for (let j = 0; j < group.commands.length; j++) {
          const command = group.commands[j];

          if (command.description === hoveredCommandBarItemId) {
            hoveredItem = command;
            break;
          }
        }

        if (hoveredItem) {
          break;
        }
      }

      if (hoveredItem) {
        hoveredItem.action();
        setOpen(false);
      }
    },
    [hoveredCommandBarItemId, filteredData, commandBarContext.commandBarIsOpen]
  );

  useHotkeys(
    [
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_UP],
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ARROW_UP],
    ],
    () => {
      if (!commandBarContext.commandBarIsOpen) return;

      const items = document.querySelectorAll(".command-bar-item");

      if (hoveredCommandBarItemId === "") {
        if (items.length > 0) {
          return setHoveredCommandBarItemId(items[0].innerHTML || "");
        }
      }

      const currentIndex = Array.from(items).findIndex(
        (item) => item.innerHTML === hoveredCommandBarItemId
      );

      if (currentIndex === -1) {
        return setHoveredCommandBarItemId("");
      } else if (currentIndex === 0) {
        return;
      } else {
        setDisableMouseHover(true);
        debouncedDisableMouseHover(false);
        return setHoveredCommandBarItemId(
          items[currentIndex - 1].innerHTML || ""
        );
      }
    },
    [
      hoveredCommandBarItemId,
      setHoveredCommandBarItemId,
      commandBarContext.commandBarIsOpen,
    ]
  );

  useHotkeys(
    [
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_DOWN],
      DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ARROW_DOWN],
    ],
    () => {
      if (!commandBarContext.commandBarIsOpen) return;

      const items = document.querySelectorAll(".command-bar-item");

      if (hoveredCommandBarItemId === "") {
        if (items.length > 0) {
          return setHoveredCommandBarItemId(items[0].innerHTML || "");
        }
      }

      const currentIndex = Array.from(items).findIndex(
        (item) => item.innerHTML === hoveredCommandBarItemId
      );

      if (currentIndex === -1) {
        return setHoveredCommandBarItemId("");
      } else if (currentIndex === items.length - 1) {
        return;
      } else {
        setDisableMouseHover(true);
        debouncedDisableMouseHover(false);
        return setHoveredCommandBarItemId(
          items[currentIndex + 1].innerHTML || ""
        );
      }
    },
    [
      hoveredCommandBarItemId,
      setHoveredCommandBarItemId,
      commandBarContext.commandBarIsOpen,
    ]
  );

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: any) => {
      if (e.key === "k" && e.metaKey) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      if (e.key === "Escape") {
        // if cursor is not in the input, close the command bar
        if (document.activeElement !== inputRef.current) {
          setOpen(false);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const onKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Escape" ||
      event.key === "ArrowUp" ||
      event.key === "ArrowDown"
    ) {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <div
        // as="div"
        className="relative z-10"
        // onClose={() => {
        //   setOpen(false);
        // }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0">
          <div className="flex flex-col items-center pt-[16vh] min-h-full">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="max-w-2xl min-h-72 max-h-[360px] overflow-hidden w-full flex flex-col rounded-lg bg-white dark:bg-zinc-900 p-2 border border-slate-200 dark:border-zinc-700">
                <HoveredCommandBarItemContext.Provider
                  value={hoveredCommadBarItemContextValue}
                >
                  <input
                    autoFocus
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      setHoveredCommandBarItemId("");
                    }}
                    onKeyUp={onKeyUp}
                    placeholder="Type a command"
                    className="pl-1 py-2 mb-2 border-b border-b-slate-200 dark:border-b-zinc-700 w-full outline-none bg-transparent text-sm dark:placeholder-zinc-600 placeholder-slate-300 dark:text-white text-black"
                  ></input>
                  <DisableMouseHoverContext.Provider
                    value={disableMouseHoverContextValue}
                  >
                    <div className="overflow-y-scroll hide-scroll">
                      {filteredData.map((group, index) => (
                        <CommandGroup
                          key={index}
                          title={group.title}
                          commands={group.commands}
                          setCommandBar={(open: boolean) => setOpen(open)}
                        />
                      ))}
                    </div>
                  </DisableMouseHoverContext.Provider>
                </HoveredCommandBarItemContext.Provider>
              </div>
            </Transition.Child>
          </div>
        </div>
      </div>
    </Transition>
  );
}

function CommandGroup({
  title,
  commands,
  setCommandBar,
}: {
  title: string;
  commands: {
    icon: React.ElementType;
    description: string;
    action: () => void;
    keybind: {
      keystrokes: string[];
      isSequential?: boolean;
    };
  }[];
  setCommandBar: (open: boolean) => void;
}) {
  return (
    <div className="select-none">
      <div className="text-xs pl-2 py-2 text-slate-400 dark:text-zinc-500">
        {title}
      </div>
      <div>
        {commands.map((command, index) => (
          <CommandItem
            key={index}
            Icon={command.icon}
            action={command.action}
            description={command.description}
            keybind={command.keybind}
            setCommandBar={setCommandBar}
          />
        ))}
      </div>
    </div>
  );
}

function CommandItem({
  Icon,
  description,
  action,
  keybind,
  setCommandBar,
}: {
  Icon: React.ElementType;
  description: string;
  action: () => void;
  keybind: {
    keystrokes: string[];
    isSequential?: boolean;
  };
  setCommandBar: (open: boolean) => void;
}) {
  // make ref
  const itemRef = useRef<HTMLDivElement>(null);
  const hoveredCommandBarItemContext = useHoveredCommandBarItemContext();
  const disableMouseHoverContext = useDisableMouseHoverContext();

  const isHovered = hoveredCommandBarItemContext.itemId === description;

  useEffect(() => {
    if (isHovered && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: "smooth", // smooth or instant
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [isHovered]);

  return (
    <div
      ref={itemRef}
      onMouseEnter={() => {
        if (!disableMouseHoverContext.disableMouseHover) {
          hoveredCommandBarItemContext.setItemId(description);
        }
      }}
      onClick={() => {
        action();
        setCommandBar(false);
      }}
      className={`p-2 w-full flex justify-between rounded-lg ${
        isHovered ? "dark:bg-zinc-800 bg-slate-100" : ""
      }`}
    >
      <div className="flex pl-2 gap-x-3 items-center">
        <div className="flex items-center">
          <Icon className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
        </div>

        <span
          // Note: created a fake classname command-bar-item to query it for moving up and down.
          className="command-bar-item text-slate-400 dark:text-zinc-500 text-sm"
        >
          {description}
        </span>
      </div>

      <div className="flex gap-x-1">
        {keybind.keystrokes.map((keystroke, index) => (
          <div key={index} className="flex items-center gap-x-1">
            {keybind.isSequential && index > 0 ? (
              <div className="text-xs text-slate-400 dark:text-zinc-500 select-none">
                then
              </div>
            ) : null}
            <div className="h-[24px] min-w-[24px] px-2 flex items-center justify-center rounded-md bg-slate-400/60 dark:bg-zinc-500/40 text-white dark:text-zinc-900 text-xs select-none">
              {keystroke}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
