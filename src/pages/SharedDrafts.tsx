import { ISelectedEmail } from "../lib/db";
import SharedDraftsThreadView from "../components/ThreadViews/SharedDraftsThreadView";

interface SharedDraftsProps {
  selectedEmail: ISelectedEmail;
}

export default function SharedDrafts({ selectedEmail }: SharedDraftsProps) {
  return <SharedDraftsThreadView selectedEmail={selectedEmail} />;
}
