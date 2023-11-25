import ThreadView from "../components/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import { ClientInboxTabType } from "../api/model/client.inbox";

const gmailFetchQueryImportant = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.INBOX
)}`;
const outlookFetchQueryImportant = `mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.INBOX
)}/messages?$select=id,conversationId,createdDateTime&$top=20`;

const filterThreadsFncImportant = (selectedEmail: ISelectedEmail) =>
  db.emailThreads
    .where("email")
    .equals(selectedEmail.email)
    .and(
      (thread) =>
        thread.labelIds.includes(FOLDER_IDS.INBOX) &&
        thread.labelIds.includes("IMPORTANT")
    )
    .reverse()
    .sortBy("date");

const filterThreadsFncOther = (selectedEmail: ISelectedEmail) =>
  db.emailThreads
    .where("email")
    .equals(selectedEmail.email)
    .and(
      (thread) =>
        thread.labelIds.includes(FOLDER_IDS.INBOX) &&
        !thread.labelIds.includes("IMPORTANT")
    )
    .reverse()
    .sortBy("date");

const tabs: ClientInboxTabType[] = [
  {
    title: "Important",
    folderId: FOLDER_IDS.INBOX,
    gmailQuery: gmailFetchQueryImportant,
    outlookQuery: outlookFetchQueryImportant,
    filterThreadsFnc: filterThreadsFncImportant,
    canArchiveThread: true,
    canTrashThread: true,
  },
  {
    title: "Other",
    folderId: FOLDER_IDS.INBOX,
    gmailQuery: gmailFetchQueryImportant,
    outlookQuery: outlookFetchQueryImportant,
    filterThreadsFnc: filterThreadsFncOther,
    canArchiveThread: true,
    canTrashThread: true,
  },
];

export default function Home() {
  return <ThreadView tabs={tabs} />;
}
