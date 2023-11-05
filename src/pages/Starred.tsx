import ThreadView from "../components/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { ISelectedEmail, db } from "../lib/db";

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Starred() {
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
      filterThreadsFnc={filterThreadsFnc}
      canArchiveThread
      canTrashThread
    />
  );
}
