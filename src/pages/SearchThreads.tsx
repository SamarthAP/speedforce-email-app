import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { Combobox } from "@headlessui/react";
import {
  buildSearchQuery,
  classNames,
  cleanHtmlString,
  delay,
  getLabelIdFromSearchFolder,
} from "../lib/util";
import { useTooltip } from "../components/UseTooltip";
import TooltipPopover from "../components/TooltipPopover";
import { useNavigate } from "react-router-dom";
import { search } from "../lib/sync";
import { useEmailPageOutletContext } from "./_emailPage";
import { IEmailThread, IMessage, ISelectedEmail, db } from "../lib/db";
import ThreadList from "../components/ThreadList";
import { useLiveQuery } from "dexie-react-hooks";
import { FOLDER_IDS } from "../api/constants";

interface SearchAction {
  prefix: string;
  validate: (text: string) => boolean;
  allowMultiple: boolean;
  generateQuery: (text: string) => string;
}

const searchActions: SearchAction[] = [
  {
    prefix: "in:",
    validate: (text: string) => {
      return true;
    },
    allowMultiple: false,
    generateQuery: (text: string) => {
      return text;
    },
  },
  {
    prefix: "from:",
    validate: (text: string) => {
      return true;
    },
    allowMultiple: true,
    generateQuery: (text: string) => {
      return text;
    },
  },
  {
    prefix: "to:",
    validate: (text: string) => {
      return true;
    },
    allowMultiple: true,
    generateQuery: (text: string) => {
      return text;
    },
  },
  {
    prefix: "subject:",
    validate: (text: string) => {
      return true;
    },
    allowMultiple: true,
    generateQuery: (text: string) => {
      return text;
    },
  },
  {
    prefix: "has:",
    validate: (text: string) => {
      return true;
    },
    allowMultiple: true,
    generateQuery: (text: string) => {
      return text;
    },
  },
  {
    prefix: "label:",
    validate: (text: string) => {
      return true;
    },
    allowMultiple: true,
    generateQuery: (text: string) => {
      return text;
    },
  },
  {
    prefix: "filename:",
    validate: (text: string) => {
      return true;
    },
    allowMultiple: true,
    generateQuery: (text: string) => {
      return text;
    },
  },
  {
    prefix: "larger:",
    validate: (text: string) => {
      return true;
    },
    allowMultiple: false,
    generateQuery: (text: string) => {
      return text;
    },
  },
  {
    prefix: "smaller:",
    validate: (text: string) => {
      return true;
    },
    allowMultiple: false,
    generateQuery: (text: string) => {
      return text;
    },
  },
  {
    prefix: "older:",
    validate: (text: string) => {
      return true;
    },
    allowMultiple: false,
    generateQuery: (text: string) => {
      return text;
    },
  },
];

export default function SearchThreads() {
  const [searchItems, setSearchItems] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const { tooltipData, handleMouseEnter, handleMouseLeave } = useTooltip();
  const navigate = useNavigate();
  const { selectedEmail } = useEmailPageOutletContext();
  const [filterFnc, setFilterFnc] = useState<() => Promise<IEmailThread[]>>();
  const [hoveredThread, setHoveredThread] = useState<IEmailThread | null>(null);
  const [selectedThread, setSelectedThread] = useState<string>("");
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredItems: string[] = [];
  // const filteredItems = [
  //   "in:sent",
  //   "in:inbox",
  //   "in:trash",
  //   "in:spam",
  //   "in:archive",
  //   "in:all",
  //   "in:starred",
  // ];

  const isValidSearchText = (text: string) => {
    if (text !== "") return true;
  };

  const onSearchTextChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const value = event.currentTarget.value;
    setSearchText(value);
    // if (value.includes(",") || value.includes(" ")) {
    //   event.preventDefault();
    // } else {
    //   if (value === "") {
    //     // Delay to allow seamless deletion of emails
    //     // If user deletes the last character of their input, the previous email should not be deleted (only if they backspace on an empty input)
    //     // 100ms is long enough for synchronous deletion 99% of the time (ensure onKeyUp fires before onChange) while being imperceptible to the user
    //     // Without this delay, random chance that deleting the last character will also delete the previous email
    //     await delay(100);
    //   }

    //   setSearchText(value);
    // }
  };

  const onSearchSelect = (item: string) => {
    setSearchItems([...searchItems, item]);
    setSearchText("");
  };

  const onKeyUp = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Enter" ||
      (event.key === " " && searchText.includes(":"))
    ) {
      const newSearchItems = [...searchItems, searchText];
      setSearchItems(newSearchItems);
      setSearchText("");

      void search(selectedEmail.email, selectedEmail.provider, newSearchItems);
    } else if (
      event.key === "Backspace" &&
      searchText === "" &&
      searchItems.length > 0
    ) {
      // Remove last email from send list
      // Must fire before onChange updates emailText
      setSearchItems(searchItems.slice(0, searchItems.length - 1));
    }
  };

  const threadIds = useLiveQuery(() => {
    return db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .primaryKeys();
  });

  const messages = useLiveQuery(() => {
    return db.messages
      .where("threadId")
      .anyOf(threadIds || [])
      .toArray();
  }, [threadIds]);

  const filteredThreads = useLiveQuery(
    () => {
      // const decodedMessages = messages?.map((message) => ({
      //   ...message,
      //   htmlData: cleanHtmlString(
      //     message.htmlData,
      //     selectedEmail.provider === "google"
      //   ).toLocaleLowerCase(),
      // }));

      return db.emailThreads
        .where("email")
        .equals(selectedEmail.email)
        .and((thread) => {
          if (searchItems.length === 0) return true;

          for (let i = 0; i < searchItems.length; i++) {
            // Search v1: Searched item must pass all filters

            const searchItem = searchItems[i];
            if (searchItem.startsWith("in:")) {
              const folder = searchItem.substring(3);
              const labelId = getLabelIdFromSearchFolder(
                selectedEmail.provider,
                folder
              );

              if (
                !thread.labelIds?.includes(labelId) &&
                !thread.labelIds?.includes(folder)
              )
                return false;
            } else if (searchItem.startsWith("from:")) {
              const from = searchItem.substring(5);
              const fromThreads = messages
                ?.filter((message) =>
                  message.from
                    .toLocaleLowerCase()
                    .includes(from.toLocaleLowerCase())
                )
                .map((message) => message.threadId);

              if (!fromThreads?.includes(thread.id)) return false;
            } else if (searchItem.startsWith("to:")) {
              const to = searchItem.substring(3);
              const toThreads = messages
                ?.filter(
                  (message) =>
                    message.toRecipients.findIndex((toRecipient) =>
                      toRecipient
                        .toLocaleLowerCase()
                        .includes(to.toLocaleLowerCase())
                    ) !== -1
                )
                .map((message) => message.threadId);

              if (!toThreads?.includes(thread.id)) return false;
            } else {
              // TODO: this super slow
              // const threadIds = decodedMessages
              //   ?.filter(
              //     (message) =>
              //       message.threadId === thread.id &&
              //       message.htmlData.includes(searchItem.toLocaleLowerCase())
              //   )
              //   .map((message) => message.threadId);

              if (
                // !threadIds?.includes(thread.id) &&
                !thread.from
                  .toLocaleLowerCase()
                  .includes(searchItem.toLocaleLowerCase()) &&
                !thread.subject
                  .toLocaleLowerCase()
                  .includes(searchItem.toLocaleLowerCase())
              )
                return false;
            }
          }

          return true;
        })
        .reverse()
        .sortBy("date");
    },
    [selectedEmail, searchItems],
    [] // default value
  );

  return (
    <main className="h-screen w-screen flex flex-col items-center dark:bg-zinc-900">
      <div className="flex flex-row justify-between items-center px-10 py-6 w-full">
        <div className="text-slate-500 pr-2">Search</div>
        <div className="flex flex-row flex-wrap w-full">
          {searchItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center mr-1.5 my-0.5 rounded-md bg-slate-200 dark:bg-zinc-700 px-2 py-1 text-sm font-semibold text-slate-600 dark:text-zinc-300 shadow-sm hover:bg-gray-300 dark:hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 cursor-default"
            >
              <span>{item}</span>
              <button
                onClick={() =>
                  setSearchItems(searchItems.filter((_, i) => i !== idx))
                }
                type="button"
                className="focus:outline-none"
              >
                <XCircleIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
          ))}

          <Combobox as="div" className="items-center" onChange={onSearchSelect}>
            <Combobox.Input
              className="block h-full border-0 bg-transparent dark:text-white text-black focus:outline-none placeholder:text-slate-500 placeholder:dark:text-zinc-400 sm:text-sm sm:leading-6"
              placeholder="..."
              pattern=""
              value={searchText}
              onChange={(event) => void onSearchTextChange(event)}
              onKeyUp={onKeyUp}
            />

            {filteredItems.length > 0 && (
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-[calc(screen/2)] overflow-y-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredItems.map((item) => (
                  <Combobox.Option
                    key={item}
                    value={item}
                    className={({ active }) =>
                      classNames(
                        "relative cursor-default select-none py-2 pl-3 pr-9",
                        active ? "bg-gray-600 text-white" : "text-gray-900"
                      )
                    }
                  >
                    {({ active }) => (
                      <>
                        <div className="flex">
                          <span className="font-semibold whitespace-nowrap">
                            {item}
                          </span>
                        </div>
                      </>
                    )}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            )}
          </Combobox>
        </div>
        <div
          onMouseEnter={(event) => {
            handleMouseEnter(event, "Close");
          }}
          onMouseLeave={handleMouseLeave}
        >
          <XMarkIcon
            className="w-4 h-4 ml-1"
            onClick={() => void navigate(-1)}
          />
        </div>
      </div>
      <ThreadList
        selectedEmail={selectedEmail}
        threads={filteredThreads}
        setSelectedThread={setSelectedThread}
        setHoveredThread={setHoveredThread}
        setScrollPosition={setScrollPosition}
        scrollRef={scrollRef}
        folderId={FOLDER_IDS.INBOX}
        canArchiveThread={true}
        canTrashThread={true}
      />
      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
    </main>
  );
}
