import ThreadView from "../components/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Done() {
  const gmailFetchQuery = ``;
  const outlookFetchQuery = `/mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
    FOLDER_IDS.DONE
  )}/messages`;

  const filterThreadsFnc = (selectedEmail: ISelectedEmail) => {
    if (selectedEmail.provider === "google") {
      return db.emailThreads
        .where("email")
        .equals(selectedEmail.email)
        .and((thread) => !thread.labelIds.includes(FOLDER_IDS.INBOX))
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

  return (
    <ThreadView
      folderId={FOLDER_IDS.DONE}
      title="Done"
      gmailFetchQuery={gmailFetchQuery}
      outlookFetchQuery={outlookFetchQuery}
      filterThreadsFnc={filterThreadsFnc}
      canTrashThread
    />
  );
}
