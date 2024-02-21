import { ISelectedEmail, db } from "../lib/db";
import { FOLDER_IDS } from "../api/constants";
import { useLiveQuery } from "dexie-react-hooks";
import GenericThreadFeedPage from "./_threadFeedPage";

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.getTime();
}

interface ThreadFeedPageProps {
  selectedEmail: ISelectedEmail;
  inboxZeroStartDate: number;
}

export default function ImportantThreadFeedPage({
  selectedEmail,
  inboxZeroStartDate,
}: ThreadFeedPageProps) {
  const email = selectedEmail.email;

  const threads = useLiveQuery(() => {
    return db.emailThreads
      .where("email")
      .equals(email)
      .and(
        (thread) =>
          thread.labelIds.includes(FOLDER_IDS.INBOX) &&
          (thread.labelIds.includes("IMPORTANT") ||
            thread.labelIds.includes("CATEGORY_PERSONAL") ||
            thread.from === email) &&
          thread.date >= (inboxZeroStartDate || getYesterdayDate()) // NOTE: default to yesterday if no inbox zero start date
      )
      .reverse()
      .sortBy("date");
  }, [email, inboxZeroStartDate]);

  return (
    <GenericThreadFeedPage
      selectedEmail={selectedEmail}
      navigationUrl="/importantThreadFeed"
      originalPageUrl="/"
      threads={threads}
    />
  );
}
