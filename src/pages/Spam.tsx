import ThreadView from "../components/ThreadViews/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import React from "react";
import Titlebar from "../components/Titlebar";
import { useEmailPageOutletContext } from "./_emailPage";
import { getThreadsExhaustive } from "../api/gmail/reactQuery/reactQueryFunctions";
import { useQuery } from "react-query";

const gmailFetchQuery = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.SPAM
)}&includeSpamTrash=true`;
const outlookFetchQuery = `mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.SPAM
)}/messages?$select=id,conversationId,createdDateTime&$top=20`;

const filterThreadsFnc = (selectedEmail: ISelectedEmail) =>
  db.emailThreads
    .where("email")
    .equals(selectedEmail.email)
    .and(
      (thread) =>
        thread.labelIds.includes(FOLDER_IDS.SPAM) &&
        !thread.labelIds.includes(FOLDER_IDS.TRASH)
    )
    .reverse()
    .sortBy("date");

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Spam() {
  const { selectedEmail } = useEmailPageOutletContext();

  const email = selectedEmail.email;
  const gmailQueryParam = "labelIds=SPAM&includeSpamTrash=true";
  const outlookQueryParam =
    "mailFolders/JunkEmail/messages?$select=id,conversationId,createdDateTime&$top=20";

  useQuery(["trash", email], () =>
    getThreadsExhaustive(
      email,
      selectedEmail.provider,
      selectedEmail.provider === "google" ? gmailQueryParam : outlookQueryParam,
      ["ID_SPAM"]
    )
  );

  return (
    <React.Fragment>
      <Titlebar />
      <div className="flex h-full overflow-hidden">
        <ThreadView
          data={{
            title: "Spam",
            // folderId: FOLDER_IDS.SPAM,
            // gmailQuery: gmailFetchQuery,
            // outlookQuery: outlookFetchQuery,
            filterThreadsFnc: filterThreadsFnc,
            canArchiveThread: true,
            canTrashThread: true,
          }}
        />
      </div>
    </React.Fragment>
  );
}
