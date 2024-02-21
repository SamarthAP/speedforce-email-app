import { ISelectedEmail, db } from "../lib/db";
import { FOLDER_IDS } from "../api/constants";
import { useLiveQuery } from "dexie-react-hooks";
import GenericThreadFeedPage from "./_threadFeedPage";

interface ThreadFeedPageProps {
  selectedEmail: ISelectedEmail;
  inboxZeroStartDate: number;
}

export default function OtherThreadFeedPage({
  selectedEmail,
  inboxZeroStartDate,
}: ThreadFeedPageProps) {
  const email = selectedEmail.email;

  const threads = useLiveQuery(() => {
    return db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and(
        (thread) =>
          thread.labelIds.includes(FOLDER_IDS.INBOX) &&
          !(
            thread.labelIds.includes("IMPORTANT") ||
            thread.labelIds.includes("CATEGORY_PERSONAL") ||
            thread.from === email
          ) &&
          thread.date >= inboxZeroStartDate
      )
      .reverse()
      .sortBy("date");
  }, [email, inboxZeroStartDate]);

  return (
    <GenericThreadFeedPage
      selectedEmail={selectedEmail}
      navigationUrl="/otherThreadFeed"
      originalPageUrl="/other"
      threads={threads}
    />
  );
}
