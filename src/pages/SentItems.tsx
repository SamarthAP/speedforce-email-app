import ThreadView from "../components/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import { ClientInboxTabType } from "../api/model/client.inbox";

const gmailFetchQuery = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.SENT
)}`;
const outlookFetchQuery = `mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.SENT
)}/messages?$select=id,conversationId,createdDateTime&$top=20`;

const filterThreadsFnc = (selectedEmail: ISelectedEmail) =>
  db.emailThreads
    .where("email")
    .equals(selectedEmail.email)
    .and(
      (thread) =>
        thread.labelIds.includes(FOLDER_IDS.SENT) &&
        !thread.labelIds.includes(FOLDER_IDS.TRASH)
    )
    .reverse()
    .sortBy("date");

const tabs: ClientInboxTabType[] = [
  {
    title: "Sent",
    folderId: FOLDER_IDS.SENT,
    gmailQuery: gmailFetchQuery,
    outlookQuery: outlookFetchQuery,
    filterThreadsFnc: filterThreadsFnc,
    canArchiveThread: true,
    canTrashThread: true,
  },
];

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function SentItems() {
  return <ThreadView tabs={tabs} />;
}
