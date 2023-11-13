import ThreadView from "../components/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { ISelectedEmail, db } from "../lib/db";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Starred() {
  const gmailFetchQuery = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
    FOLDER_IDS.STARRED
  )}&includeSpamTrash=true`;
  const outlookFetchQuery = `messages?$select=id,conversationId,createdDateTime&$top=20&$filter=flag/flagStatus eq 'flagged'`;

  const filterThreadsFnc = (selectedEmail: ISelectedEmail) =>
    db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and((thread) => thread.labelIds.includes("STARRED"))
      .reverse()
      .sortBy("date");

  return (
    <ThreadView
      folderId={FOLDER_IDS.STARRED}
      title="Starred"
      gmailFetchQuery={gmailFetchQuery}
      outlookFetchQuery={outlookFetchQuery}
      filterThreadsFnc={filterThreadsFnc}
      canArchiveThread
      canTrashThread
    />
  );
}
