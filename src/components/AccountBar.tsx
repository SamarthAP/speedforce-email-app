import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Transition } from "@headlessui/react";
import { useHotkeys } from "react-hotkeys-hook";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";

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
import { IEmail, db } from "../lib/db";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { downloadProfilePictures } from "../lib/sync";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { classNames } from "../lib/util";

export default function AccountBar() {
  const { selectedEmail } = useEmailPageOutletContext();
  const [open, setOpen] = useState(false);
  const accountBarContext = useAccountBarOpenContext();
  const [hoveredAccountBarItemId, setHoveredAccountBarItemId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentEmail, setCurrentEmail] = useState<IEmail | null>(null);

  const getProfilePictures = async () => {
    await downloadProfilePictures();
  };

  useEffect(() => {
    getProfilePictures();
  }, []);
  const signedInEmails = useLiveQuery(() => {
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
  const [disableMouseHover, setDisableMouseHover] = useState(false);
  const disableMouseHoverContextValue = {
    disableMouseHover,
    setDisableMouseHover,
  };

  // Toggle the menu when ctrl+tab is pressed
  useEffect(() => {
    const down = (e: any) => {
      if (e.key === "Tab" && open) {
      } else if (e.key === "Tab" && e.ctrlKey && !open) {
        e.preventDefault();
        setOpen((open) => true);
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
  }, []);

  useEffect(() => {
    if (open) {
      accountBarContext.setAccountBarIsOpen(true);
    } else {
      accountBarContext.setAccountBarIsOpen(false);

      // Timeout to prevent accountBar re-ordering before it closes
      setTimeout(() => {
        if (currentEmail) {
          setSelectedEmail(currentEmail);
        }
      }, 200);
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
      const items = document.querySelectorAll(".account-bar-item");

      if (hoveredAccountBarItemId === "") {
        if (items.length > 0) {
          return setHoveredAccountBarItemId(items[0].innerHTML || "");
        }
      }

      var currentIndex = Array.from(items).findIndex(
        (item) => item.innerHTML === hoveredAccountBarItemId
      );

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

  //doesn't work atm -> idk if we need it
  // useHotkeys(
  //   [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.ARROW_LEFT]],
  //   () => {
  //     if (!accountBarContext.accountBarIsOpen) return;

  //     const items = document.querySelectorAll(".account-bar-item");

  //     if (hoveredAccountBarItemId === "") {
  //       if (items.length > 0) {
  //         return setHoveredAccountBarItemId(items[0].innerHTML || "");
  //       }
  //     }

  //     const currentIndex = Array.from(items).findIndex(
  //       (item) => item.innerHTML === hoveredAccountBarItemId
  //     );

  //     if (currentIndex === -1) {
  //       return setHoveredAccountBarItemId("");
  //     } else {
  //       setDisableMouseHover(true);
  //       debouncedDisableMouseHover(false);
  //       return setHoveredAccountBarItemId(
  //         items[currentIndex + 1].innerHTML || ""
  //       );
  //     }
  //   },
  //   [
  //     hoveredAccountBarItemId,
  //     setHoveredAccountBarItemId,
  //     accountBarContext.accountBarIsOpen,
  //   ]
  // );

  return (
    <Transition appear show={open} as={Fragment}>
      <div className="relative z-10">
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
          <div className="flex flex-col items-center justify-center pt-[16vh] min-h-ful">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="max-w-2xl h-40 w-full flex flex-row rounded-lg bg-white dark:bg-zinc-900 p-2 border border-slate-200 dark:border-zinc-700">
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
                          profilePictureUrl={email.profilePictureUrl}
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
  profilePictureUrl,
  setEmail,
  setAccountBar,
}: {
  description: string;
  email: IEmail;
  profilePictureUrl?: string;
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
        setEmail(email);
      }}
      onMouseDown={(e) => {
        if (e.button === 0) {
          if (email) {
            setEmail(email);
          }
          setAccountBar(false);
          hoveredAccountBarItemContext.setItemId("");
        }
      }}
      onClick={() => {
        if (email) {
          setEmail(email);
        }
        setAccountBar(false);
      }}
      className={`p-2 w-full flex justify-center rounded-lg ${
        isHovered ? "dark:bg-zinc-800 bg-slate-100" : ""
      }`}
    >
      <div className="flex flex-col gap-x-3 items-center justify-center">
        <div className="flex items-center"></div>
        {profilePictureUrl ? (
          <img
            src={profilePictureUrl}
            alt="Profile Picture"
            className="h-8 w-8 rounded-full"
          />
        ) : (
          // <div className="h-8 w-8 rounded-full"></div>
          <UserCircleIcon
            className={classNames(
              "h-8 w-8 rounded-full",
              // isBackgroundOn ? "text-white" : "text-black dark:text-white"
              "text-black dark:text-white"
            )}
          />
        )}
        <span
          ref={spanRef.current}
          // Note: created a fake classname command-bar-item to query it for moving up and down.
          className="account-bar-item text-slate-400 dark:text-zinc-500 text-sm mt-2"
        >
          {description}
        </span>
      </div>
    </div>
  );
}
