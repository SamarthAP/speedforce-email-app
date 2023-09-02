import ThreadView from "../components/ThreadView";
import { ID_INBOX } from "../api/constants";

export default function Home() {
  return (
    <ThreadView folderId={ID_INBOX} title="Important"/>
  );
}