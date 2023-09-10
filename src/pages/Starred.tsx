import ThreadView from "../components/ThreadView";
import { ID_STARRED } from "../api/constants";

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Starred() {
  return (
    <ThreadView folderId={ID_STARRED} title="Starred"/>
  )
}