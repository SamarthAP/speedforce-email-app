import ThreadView from "../components/ThreadViews/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import React from "react";
import Titlebar from "../components/Titlebar";

const gmailFetchQueryOther = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.INBOX
)}`;
const outlookFetchQueryOther = `mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.INBOX
)}/messages?$select=id,conversationId,createdDateTime&$top=20`;

const filterThreadsFncOther = (selectedEmail: ISelectedEmail) =>
  db.emailThreads
    .where("email")
    .equals(selectedEmail.email)
    .and(
      (thread) =>
        thread.labelIds.includes(FOLDER_IDS.INBOX) &&
        !(
          thread.labelIds.includes("IMPORTANT") ||
          thread.labelIds.includes("CATEGORY_PERSONAL")
        )
      // Question: should Other include threads that are older than inbox zero start date?
    )
    .reverse()
    .sortBy("date");

export default function Other() {
  return (
    <React.Fragment>
      <Titlebar />
      <div className="flex h-full overflow-hidden">
        <ThreadView
          data={{
            title: "Other",
            folderId: FOLDER_IDS.INBOX,
            gmailQuery: gmailFetchQueryOther,
            outlookQuery: outlookFetchQueryOther,
            filterThreadsFnc: filterThreadsFncOther,
            canArchiveThread: true,
            canTrashThread: true,
          }}
          tabs={[
            {
              title: "Important",
              href: "/",
            },
            {
              title: "Other",
              href: "/other",
            },
          ]}
        />
      </div>
    </React.Fragment>
  );
}
