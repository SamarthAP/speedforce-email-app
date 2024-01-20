import React from "react";
import ThreadView from "../components/ThreadViews/ThreadView";
import { FOLDER_IDS } from "../api/constants";
// import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
// import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import Titlebar from "../components/Titlebar";
import { useEmailPageOutletContext } from "./_emailPage";
import { useQuery } from "react-query";
import { getThreadsExhaustive } from "../api/gmail/reactQuery/reactQueryFunctions";

// const gmailFetchQuery = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
//   FOLDER_IDS.TRASH
// )}&includeSpamTrash=true`;
// const outlookFetchQuery = `mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
//   FOLDER_IDS.TRASH
// )}/messages?$select=id,conversationId,createdDateTime&$top=20`;

const filterThreadsFnc = (selectedEmail: ISelectedEmail) =>
  db.emailThreads
    .where("email")
    .equals(selectedEmail.email)
    .and((thread) => thread.labelIds.includes(FOLDER_IDS.TRASH))
    .reverse()
    .sortBy("date");

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function DeletedItems() {
  const { selectedEmail } = useEmailPageOutletContext();

  const email = selectedEmail.email;
  const gmailQueryParam = "labelIds=TRASH&includeSpamTrash=true";
  const outlookQueryParam =
    "mailFolders/DeletedItems/messages?$select=id,conversationId,createdDateTime&$top=20";

  useQuery(["trash", email], () =>
    getThreadsExhaustive(
      email,
      selectedEmail.provider,
      selectedEmail.provider === "google" ? gmailQueryParam : outlookQueryParam,
      ["ID_TRASH"]
    )
  );

  return (
    <React.Fragment>
      <Titlebar />
      <div className="flex h-full overflow-hidden">
        <ThreadView
          data={{
            title: "Deleted Items",
            // folderId: FOLDER_IDS.TRASH,
            // gmailQuery: gmailFetchQuery,
            // outlookQuery: outlookFetchQuery,
            filterThreadsFnc: filterThreadsFnc,
            canArchiveThread: true,
            canDeletePermanentlyThread: true,
          }}
        />
      </div>
    </React.Fragment>
  );
}
