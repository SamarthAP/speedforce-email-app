import ThreadView from "../components/ThreadViews/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { ISelectedEmail, db } from "../lib/db";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import React from "react";
import Titlebar from "../components/Titlebar";

// TODO: May be able to abstract this away as well
const gmailFetchQuery = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.STARRED
)}&includeSpamTrash=true`;
const outlookFetchQuery = `messages?$select=id,conversationId,createdDateTime&$top=20&$filter=flag/flagStatus eq 'flagged'`;

const filterThreadsFnc = (selectedEmail: ISelectedEmail) =>
  db.emailThreads
    .where("email")
    .equals(selectedEmail.email)
    .and(
      (thread) =>
        thread.labelIds.includes("STARRED") &&
        !thread.labelIds.includes(FOLDER_IDS.TRASH)
    )
    .reverse()
    .sortBy("date");

// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Starred() {
  return (
    <React.Fragment>
      <Titlebar />
      <div className="flex h-full overflow-hidden">
        <ThreadView
          data={{
            title: "Starred",
            folderId: FOLDER_IDS.STARRED,
            gmailQuery: gmailFetchQuery,
            outlookQuery: outlookFetchQuery,
            filterThreadsFnc: filterThreadsFnc,
            canArchiveThread: true,
            canTrashThread: true,
          }}
        />
      </div>
    </React.Fragment>
  );
}
