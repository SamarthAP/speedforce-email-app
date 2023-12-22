import ThreadView from "../components/ThreadView";
import { FOLDER_IDS } from "../api/constants";

import { IMessage, ISelectedEmail, db } from "../lib/db";
import { ClientInboxTabType } from "../api/model/client.inbox";
import { useState } from "react";
import { getFolderIdFromSearchFolder } from "../lib/util";

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

        for (let i = 0; i < searchItems.length; i++) {
          // Search v1: Searched item must pass all filters
          const searchItem = searchItems[i];
          if (searchItem.startsWith("in:")) {
            const folder = searchItem.substring(3);
            if (folder === "starred") {
              if (!thread.labelIds?.includes("STARRED")) return false;
            } else {
              const labelId = getFolderIdFromSearchFolder(
                selectedEmail.provider,
                folder
              );

              if (
                !thread.labelIds?.includes(labelId) &&
                !thread.labelIds?.includes(folder)
              )
                return false;
            }
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

  const tabs: ClientInboxTabType[] = [
    {
      title: "Search",
      folderId: "",
      gmailQuery: "",
      outlookQuery: "",
      filterThreadsSearchFnc: filterThreadsSearchFnc,
      canArchiveThread: true,
      canTrashThread: true,
      isSearchMode: true,
    },
  ];

  return (
    <ThreadView
      tabs={tabs}
      searchItems={searchItems}
      setSearchItems={setSearchItems}
    />
  );
}
