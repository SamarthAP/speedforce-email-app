import ThreadView from "../components/ThreadView";
import { ID_STARRED } from "../api/constants";
import { db } from "../lib/db";

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Starred() {

  const queryFnc = (selectedEmail: string) => db.emailThreads
    .where("email")
    .equals(selectedEmail)
    .and((thread) => thread.starred)
    .reverse()
    .sortBy("date");

  return (
    <ThreadView folderId={ID_STARRED} title="Starred" queryFnc={queryFnc}/>
  )
}