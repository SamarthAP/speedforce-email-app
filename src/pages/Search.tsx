import React, { useState } from "react";
import SearchThreadView from "../components/ThreadViews/SearchThreadView";
import { IMessage, ISelectedEmail, db } from "../lib/db";
import {
  fromActionHandler,
  genericSearchHandler,
  inActionHandler,
  toActionHandler,
} from "../lib/dexie/searchHandlers";
import Titlebar from "../components/Titlebar";

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Search() {
  const [searchItems, setSearchItems] = useState<string[]>([]);

  const filterThreadsSearchFnc = (
    selectedEmail: ISelectedEmail,
    searchItems: string[],
    messages: IMessage[]
  ) =>
    db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and((thread) => {
        if (searchItems.length === 0) return false;

        const threadMessages = messages.filter(
          (message) => message.threadId === thread.id
        );

        for (let i = 0; i < searchItems.length; i++) {
          // Search v1: Searched item must pass all filters
          const searchItem = searchItems[i];
          if (searchItem.startsWith("in:")) {
            if (
              !inActionHandler(searchItem.substring(3), thread, selectedEmail)
            )
              return false;
          } else if (searchItem.startsWith("from:")) {
            if (
              !fromActionHandler(
                searchItem.substring(5),
                thread,
                threadMessages
              )
            ) {
              return false;
            }
          } else if (searchItem.startsWith("to:")) {
            if (
              !toActionHandler(searchItem.substring(3), thread, threadMessages)
            ) {
              return false;
            }
          } else {
            if (!genericSearchHandler(searchItem, thread, threadMessages)) {
              return false;
            }
          }
        }

        return true;
      })
      .reverse()
      .sortBy("date");

  return (
    <SearchThreadView
      data={{
        title: "Search",
        // folderId: "",
        filterThreadsSearchFnc: filterThreadsSearchFnc,
        canArchiveThread: true,
        canTrashThread: true,
      }}
      searchItems={searchItems}
      setSearchItems={setSearchItems}
    />
  );
}
