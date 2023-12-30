import { useEffect, useRef, useState } from "react";
import { dLog } from "../lib/noProd";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { search } from "../lib/sync";
import { classNames, parseSearchQuery } from "../lib/util";
import { MagnifyingGlassIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Combobox } from "@headlessui/react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";

interface SearchBarProps {
  setSearchItems: (searchItems: string[]) => void;
}

export default function SearchBar({ setSearchItems }: SearchBarProps) {
  const [searchText, setSearchText] = useState<string>("");
  const { selectedEmail } = useEmailPageOutletContext();

  // Pull search history from indexeddb
  const searchQueries = useLiveQuery(() => {
    return db.searchHistory
      .where("email")
      .equals(selectedEmail.email)
      .reverse()
      .sortBy("lastInteraction");
  });

  const filteredItems = searchQueries
    ? searchQueries
        .filter((q) =>
          q.searchQuery
            .toLocaleLowerCase()
            .startsWith(searchText.toLocaleLowerCase())
        )
        .map((q) => q.searchQuery)
        .slice(0, 5)
    : [];

  const onSearchTextChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const value = event.currentTarget.value;
    setSearchText(value);
  };

  // handler for dropdown select
  const onSearchSelect = async (item: string) => {
    void triggerSearch(item);
    setSearchText(item);
  };

  // search handler
  const triggerSearch = async (searchQuery: string) => {
    const searchItems = parseSearchQuery(searchQuery);
    if (searchItems.length === 0) return;

    setSearchItems(searchItems);
    void search(selectedEmail.email, selectedEmail.provider, searchItems);
  };

  const onKeyUp = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      void triggerSearch(searchText);
    }
  };

  const comboInputRef = useRef<HTMLInputElement>(null);
  const comboButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // focus on textinput on first render
    if (comboInputRef.current && comboButtonRef.current) {
      comboInputRef.current.focus();
      comboButtonRef.current.click();
    }
  }, []);

  return (
    <div className="flex w-full items-center mr-8">
      <div className="flex flex-row flex-wrap w-full">
        <Combobox
          as="div"
          className="flex items-center"
          onChange={(value: string) => void onSearchSelect(value)}
        >
          <Combobox.Button ref={comboButtonRef}>
            <Combobox.Input
              className="block h-full border-0 bg-transparent dark:text-white text-black focus:outline-none placeholder:text-slate-500 placeholder:dark:text-zinc-400 sm:text-sm sm:leading-6"
              placeholder="..."
              pattern=""
              value={searchText}
              onChange={(event) => void onSearchTextChange(event)}
              onKeyUp={(event) => void onKeyUp(event)}
              ref={comboInputRef}
            />
          </Combobox.Button>

          <Combobox.Options className="absolute z-10 top-20 max-h-60 w-[calc(screen/2)] overflow-y-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            <Combobox.Option
              value={searchText}
              className={({ active }) =>
                classNames(
                  "relative cursor-default select-none py-2 pl-3 pr-9 border-b",
                  active ? "bg-gray-600 text-white" : "text-gray-900"
                )
              }
            >
              <div className="flex">
                <span className="font-semibold whitespace-nowrap">
                  Search results for &ldquo;{searchText}&rdquo;
                </span>
              </div>
            </Combobox.Option>
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
                      <ClockIcon className="w-5 h-5 mr-2" />
                      <span className="font-semibold whitespace-nowrap">
                        {item}
                      </span>
                    </div>
                  </>
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
          {/* {filteredItems.length > 0 && (
          )} */}
        </Combobox>
      </div>
      <button onClick={() => void triggerSearch(searchText)}>
        <MagnifyingGlassIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
