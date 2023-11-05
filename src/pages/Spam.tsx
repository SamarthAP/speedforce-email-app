import ThreadView from "../components/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Spam() {
  const gmailFetchQuery = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
    FOLDER_IDS.SPAM
  )}&includeSpamTrash=true`;
  const outlookFetchQuery = `mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
    FOLDER_IDS.SPAM
  )}/messages`;

  const filterThreadsFnc = (selectedEmail: ISelectedEmail) =>
    db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and((thread) => thread.labelIds.includes(FOLDER_IDS.SPAM))
      .reverse()
      .sortBy("date");

  return (
    <ThreadView
      folderId={FOLDER_IDS.SPAM}
      title="Spam"
      gmailFetchQuery={gmailFetchQuery}
      outlookFetchQuery={outlookFetchQuery}
      filterThreadsFnc={filterThreadsFnc}
      canArchiveThread
      canTrashThread
    />
  );
}
