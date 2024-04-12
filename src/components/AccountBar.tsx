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
  useAccountBarOpenContext,
  useHoveredAccountBarItemContext,
  HoveredAccountBarItemContext,
} from "../contexts/AccountBarContext";
import {
  DisableMouseHoverContext,
  useDisableMouseHoverContext,
} from "../contexts/DisableMouseHoverContext";
import { useDebounceCallback } from "usehooks-ts";
import { useLiveQuery } from "dexie-react-hooks";
import { IEmail, ISelectedEmail, db } from "../lib/db";
import useKeyPressSequence from "../hooks/hotkeys";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { getProfilePicture } from "../api/gmail/people/contact";
import { getAccessToken } from "../api/accessToken";

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

// interface CommandBarProps {
//   data: CommandBarGroupData[];
// }

export default function AccountBar() {
  const { selectedEmail } = useEmailPageOutletContext();
  const [open, setOpen] = useState(false);
  const accountBarContext = useAccountBarOpenContext();
  const [hoveredAccountBarItemId, setHoveredAccountBarItemId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const spanRef = useRef(null);
  const [currentEmail, setCurrentEmail] = useState<IEmail | null>(null);

  const getStuff = async () => {
    const accessToken = await getAccessToken(selectedEmail.email);
    if (accessToken) {
      console.log("accessToken", accessToken);
      const test = await getProfilePicture(accessToken);
      if (test) {
        console.log("Profile information", test);
      }
    }
  };

  useEffect(() => {
    getStuff();
  }, []);
  const signedInEmails = useLiveQuery(() => {
    // return db.emails.orderBy("email").toArray();
    return db.emails
      .orderBy("email")
      .toArray()
      .then((emails) => {
        emails.sort((a, b) => {
          if (a.email === selectedEmail.email) return -1;
          if (b.email === selectedEmail.email) return 1;
          return a.email.localeCompare(b.email);
        });
        setCurrentEmail(emails[0]);
        return emails;
      });
  }, [selectedEmail]);

  const setSelectedEmail = async (email: IEmail) => {
    await db.selectedEmail.put({
      id: 1,
      email: email.email,
      provider: email.provider,
      inboxZeroStartDate: email.inboxZeroStartDate,
    });
  };
  // const test = useLiveQuery(() => {
  //   return db.emails
  //     .orderBy("email")
  //     .toArray()
  //     .then((emails) => {
  //       emails.sort((a, b) => {
  //         if (a.email === selectedEmail.email) return -1;
  //         if (b.email === selectedEmail.email) return 1;
  //         return a.email.localeCompare(b.email);
  //       });
  //       return emails
  //     });
  // }, []);

  const [disableMouseHover, setDisableMouseHover] = useState(false);
  const disableMouseHoverContextValue = {
    disableMouseHover,
    setDisableMouseHover,
  };

  // Toggle the menu when ctrl+tab is pressed
  useEffect(() => {
    const down = (e: any) => {
      if (e.key === "Tab" && open) {
        // console.log("we already open");
      } else if (e.key === "Tab" && e.ctrlKey && !open) {
        console.log("CTRL + TAB");
        e.preventDefault();
        setOpen((open) => true);
      }

      if (e.key === "Escape") {
        // if cursor is not in the input, close the command bar
        if (document.activeElement !== inputRef.current) {
          setOpen(false);
        }
      }
    };

    const up = (e: any) => {
      if (e.key === "Control") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    document.addEventListener("keyup", up);

    return () => {
      document.removeEventListener("keydown", down);
      document.addEventListener("keyup", up);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      accountBarContext.setAccountBarIsOpen(true);
    } else {
      console.log("we are closing");
      if (currentEmail) {
        setSelectedEmail(currentEmail);
      }
      accountBarContext.setAccountBarIsOpen(false);
    }
  }, [open, accountBarContext]);

  const hoveredAccountBarItemContextValue = useMemo(
    () => ({
      itemId: hoveredAccountBarItemId,
      setItemId: (id: string) => void setHoveredAccountBarItemId(id),
    }),
    [hoveredAccountBarItemId, setHoveredAccountBarItemId]
  );

  const debouncedDisableMouseHover = useDebounceCallback(
    setDisableMouseHover,
    300
  );

  useHotkeys(
    [
      `${DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SWITCH_ACCOUNTS]}+${
        DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SWITCH_TAB]
      }`, // Check for Ctrl + Tab
    ],
    () => {
      console.log("we moving to the right");

      const items = document.querySelectorAll(".account-bar-item");
      console.log("ALL ITEMS", items);

      if (hoveredAccountBarItemId === "") {
        if (items.length > 0) {
          return setHoveredAccountBarItemId(items[0].innerHTML || "");
        }
      }

      var currentIndex = Array.from(items).findIndex(
        (item) => item.innerHTML === hoveredAccountBarItemId
      );
      console.log("hoveredindex", hoveredAccountBarItemId);
      console.log("currentindex", currentIndex);

      if (currentIndex === -1) {
        return setHoveredAccountBarItemId("");
      } else {
        setDisableMouseHover(true);
        debouncedDisableMouseHover(false);
        if (currentIndex === items.length - 1) {
          currentIndex = 0;
        } else currentIndex = currentIndex + 1;
        return setHoveredAccountBarItemId(items[currentIndex].innerHTML || "");
      }
    },
    [
      hoveredAccountBarItemId,
      setHoveredAccountBarItemId,
      accountBarContext.accountBarIsOpen,
    ]
  );

  // useEffect(() => {
  //   console.log("wtf");
  //   if (!accountBarContext.accountBarIsOpen) return;

  //   useKeyPressSequence(
  //     DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SWITCH_ACCOUNTS],
  //     DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SWITCH_TAB],
  //     () => {
  //       console.log("we schmoving");
  //     }
  //   );
  // }, [
  //   hoveredCommandBarItemId,
  //   setHoveredCommandBarItemId,
  //   accountBarContext.accountBarIsOpen,
  // ]);

  useHotkeys(
    [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ARROW_LEFT]],
    () => {
      if (!accountBarContext.accountBarIsOpen) return;

      console.log("we moving to the left");
      const items = document.querySelectorAll(".account-bar-item");

      if (hoveredAccountBarItemId === "") {
        if (items.length > 0) {
          return setHoveredAccountBarItemId(items[0].innerHTML || "");
        }
      }

      const currentIndex = Array.from(items).findIndex(
        (item) => item.innerHTML === hoveredAccountBarItemId
      );

      if (currentIndex === -1) {
        return setHoveredAccountBarItemId("");
      } else {
        setDisableMouseHover(true);
        debouncedDisableMouseHover(false);
        return setHoveredAccountBarItemId(
          items[currentIndex + 1].innerHTML || ""
        );
      }
    },
    [
      hoveredAccountBarItemId,
      setHoveredAccountBarItemId,
      accountBarContext.accountBarIsOpen,
    ]
  );

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
          <div className="flex flex-col items-center pt-[16vh] min-h-full bg-red">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="max-w-2xl h-72 w-full flex flex-row rounded-lg bg-white dark:bg-zinc-900 p-2 border border-slate-200 dark:border-zinc-700">
                <HoveredAccountBarItemContext.Provider
                  value={hoveredAccountBarItemContextValue}
                >
                  <DisableMouseHoverContext.Provider
                    value={disableMouseHoverContextValue}
                  >
                    <div className="overflow-y-scroll hide-scroll"></div>
                    {signedInEmails?.map((email, index) => {
                      return (
                        <AccountItem
                          key={index}
                          description={email.email}
                          email={email}
                          setEmail={setCurrentEmail}
                          setAccountBar={(open: boolean) => setOpen(open)}
                        />
                      );
                    })}
                  </DisableMouseHoverContext.Provider>
                </HoveredAccountBarItemContext.Provider>
              </div>
            </Transition.Child>
          </div>
        </div>
      </div>
    </Transition>
  );
}

function AccountItem({
  description,
  email,
  setEmail,
  setAccountBar,
}: {
  description: string;
  email: IEmail;
  setEmail: React.Dispatch<React.SetStateAction<IEmail | null>>;
  setAccountBar: (open: boolean) => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const hoveredAccountBarItemContext = useHoveredAccountBarItemContext();
  const disableMouseHoverContext = useDisableMouseHoverContext();
  const spanRef = useRef(null);
  const isHovered = hoveredAccountBarItemContext.itemId === description;
  useEffect(() => {
    if (isHovered && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: "smooth", // smooth or instant
        block: "nearest",
        inline: "nearest",
      });
      setEmail(email);
    }
  }, [isHovered]);
  return (
    <div
      ref={itemRef}
      onMouseEnter={() => {
        if (!disableMouseHoverContext.disableMouseHover) {
          hoveredAccountBarItemContext.setItemId(description);
        }
        console.log("entering");
        setEmail(email);
      }}
      onMouseDown={(e) => {
        // console.log(e);
        if (e.button === 0) {
          if (email) {
            setEmail(email);
          }
          setAccountBar(false);
          hoveredAccountBarItemContext.setItemId("");
        }
      }}
      onClick={(event) => {
        console.log("event");
        console.log("we clicked the stuff");
        if (email) {
          setEmail(email);
        }
        setAccountBar(false);
      }}
      className={`p-2 w-full flex justify-center rounded-lg ${
        isHovered
          ? //  "bg-red-500" : ""
            "dark:bg-zinc-800 bg-slate-100"
          : ""
      }`}
    >
      <div className="flex gap-x-3 items-center">
        <div className="flex items-center"></div>

        <span
          ref={spanRef.current}
          // Note: created a fake classname command-bar-item to query it for moving up and down.
          className="account-bar-item text-slate-400 dark:text-zinc-500 text-sm"
        >
          {description}
        </span>
      </div>
    </div>
  );
}
