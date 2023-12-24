import { useEffect, useState } from "react";
import { dLog } from "../lib/noProd";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { search } from "../lib/sync";
import { classNames } from "../lib/util";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Combobox } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";

interface SearchBarProps {
  setSearchItems: (searchItems: string[]) => void;
  // setSearchMode: (searchMode: boolean) => void;
}

export default function SearchBar({ setSearchItems }: SearchBarProps) {
  const [localSearchItems, setLocalSearchItems] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const { selectedEmail } = useEmailPageOutletContext();
  const navigate = useNavigate();

  // const searchQueries = useLiveQuery(() => {
  //   return db.searchHistory
  //     .where("email")
  //     .equals(selectedEmail.email)
  //     .reverse()
  //     .sortBy("lastInteraction");
  // });

  const filteredItems: string[] =
    // searchQueries?.map((q) => q.searchItems.join(" ")) ||
    [
      // "in:sent",
      // "in:inbox",
      // "in:trash",
      // "in:spam",
      // "in:archive",
      // "in:all",
      // "in:starred",
      // "has:attachment",
    ];

  const onSearchTextChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const value = event.currentTarget.value;
    setSearchText(value);
  };

  const onSearchSelect = (item: string) => {
    setLocalSearchItems([...localSearchItems, item]);
    setSearchText("");
  };

  const triggerSearch = async () => {
    let newSearchItems = [...localSearchItems];
    if (searchText !== "") {
      newSearchItems.push(searchText);
      setSearchText("");
    }

    setSearchItems(newSearchItems);
    setLocalSearchItems(newSearchItems);

    void search(selectedEmail.email, selectedEmail.provider, newSearchItems);
  };

  const onKeyUp = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === " " && searchText.includes(":")) {
      const newSearchItems = [...localSearchItems, searchText];
      setLocalSearchItems(newSearchItems);
      setSearchText("");
    } else if (event.key === "Enter") {
      triggerSearch();
    } else if (
      event.key === "Backspace" &&
      searchText === "" &&
      localSearchItems.length > 0
    ) {
      // Remove last email from send list
      // Must fire before onChange updates emailText
      setLocalSearchItems(
        localSearchItems.slice(0, localSearchItems.length - 1)
      );
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        navigate(-1);
        dLog("Escape pressed");
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  });

  return (
    <div className="flex w-full items-center mr-8">
      <div className="flex flex-row flex-wrap w-full">
        {localSearchItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center mr-1.5 my-0.5 rounded-md bg-slate-200 dark:bg-zinc-700 px-2 py-1 text-sm font-semibold text-slate-600 dark:text-zinc-300 shadow-sm hover:bg-gray-300 dark:hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 cursor-default"
          >
            <span>{item}</span>
            <button
              onClick={() =>
                setLocalSearchItems(
                  localSearchItems.filter((_, i) => i !== idx)
                )
              }
              type="button"
              className="focus:outline-none"
            >
              <XCircleIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        ))}

        <Combobox
          as="div"
          className="flex items-center"
          onChange={onSearchSelect}
        >
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
      <button onClick={() => void triggerSearch()}>
        <MagnifyingGlassIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
