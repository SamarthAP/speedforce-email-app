import ThreadView from "../components/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Drafts() {
  const gmailFetchQuery = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
    FOLDER_IDS.DRAFTS
  )}`;
  const outlookFetchQuery = `mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
    FOLDER_IDS.DRAFTS
  )}/messages?$select=id,conversationId,createdDateTime&$top=20`;

  const filterThreadsFnc = (selectedEmail: ISelectedEmail) =>
    db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and((thread) => thread.labelIds.includes(FOLDER_IDS.DRAFTS))
      .reverse()
      .sortBy("date");

  return (
    <ThreadView
      folderId={FOLDER_IDS.DRAFTS}
      title="Drafts"
      gmailFetchQuery={gmailFetchQuery}
      outlookFetchQuery={outlookFetchQuery}
      filterThreadsFnc={filterThreadsFnc}
      canArchiveThread
      canTrashThread
    />
  );
}
