import ThreadView from "../components/ThreadViews/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import React from "react";
import Titlebar from "../components/Titlebar";

const gmailFetchQuery = ``;
const outlookFetchQuery = `mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.DONE
)}/messages?$select=id,conversationId,createdDateTime&$top=20`;

const filterThreadsFnc = (selectedEmail: ISelectedEmail) => {
  if (selectedEmail.provider === "google") {
    return db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and(
        (thread) =>
          !thread.labelIds.includes(FOLDER_IDS.INBOX) &&
          !thread.labelIds.includes(FOLDER_IDS.TRASH)
      )
      .reverse()
      .sortBy("date");
  } else {
    return db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and((thread) => thread.labelIds.includes(FOLDER_IDS.DONE))
      .reverse()
      .sortBy("date");
  }
};

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Done() {
  return (
    <React.Fragment>
      <Titlebar />
      <div className="flex h-full overflow-hidden">
        <ThreadView
          data={{
            title: "Done",
            folderId: FOLDER_IDS.DONE,
            gmailQuery: gmailFetchQuery,
            outlookQuery: outlookFetchQuery,
            filterThreadsFnc: filterThreadsFnc,
            canArchiveThread: false,
            canTrashThread: true,
          }}
        />
      </div>
    </React.Fragment>
  );
}
