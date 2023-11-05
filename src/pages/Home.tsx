import ThreadView from "../components/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { useEffect } from "react";
import { useEmailPageOutletContext } from "./_emailPage";
import { partialSync } from "../lib/sync";
import { dLog } from "../lib/noProd";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";

export default function Home() {
  const { selectedEmail } = useEmailPageOutletContext();

  const gmailFetchQuery = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
    FOLDER_IDS.INBOX
  )}`;
  const outlookFetchQuery = `/mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
    FOLDER_IDS.INBOX
  )}/messages`;

  const filterThreadsFnc = (selectedEmail: ISelectedEmail) =>
    db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and((thread) => thread.labelIds.includes(FOLDER_IDS.INBOX))
      .reverse()
      .sortBy("date");

  return (
    <ThreadView
      folderId={FOLDER_IDS.INBOX}
      title="Important"
      gmailFetchQuery={gmailFetchQuery}
      outlookFetchQuery={outlookFetchQuery}
      filterThreadsFnc={filterThreadsFnc}
      canArchiveThread
      canTrashThread
    />
  );
}
