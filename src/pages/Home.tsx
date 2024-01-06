import InboxThreadView from "../components/ThreadViews/InboxThreadView";
import { FOLDER_IDS } from "../api/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import { ClientInboxTabType } from "../api/model/client.inbox";

const gmailFetchQueryImportant = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.INBOX
)}`;
const outlookFetchQueryImportant = `mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.INBOX
)}/messages?$select=id,conversationId,createdDateTime&$top=20`;

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.getTime();
}

interface HomeProps {
  inboxZeroStartDate: number;
}

export default function Home({ inboxZeroStartDate }: HomeProps) {
  const filterThreadsFncImportant = (selectedEmail: ISelectedEmail) =>
    db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and(
        (thread) =>
          thread.labelIds.includes(FOLDER_IDS.INBOX) &&
          (thread.labelIds.includes("IMPORTANT") ||
            thread.labelIds.includes("CATEGORY_PERSONAL")) &&
          thread.date >= (inboxZeroStartDate || getYesterdayDate()) // NOTE: default to yesterday if no inbox zero start date
      )
      .reverse()
      .sortBy("date");

  const filterThreadsFncOther = (selectedEmail: ISelectedEmail) =>
    db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and(
        (thread) =>
          thread.labelIds.includes(FOLDER_IDS.INBOX) &&
          !(
            thread.labelIds.includes("IMPORTANT") ||
            thread.labelIds.includes("CATEGORY_PERSONAL")
          ) &&
          thread.date >= (inboxZeroStartDate || getYesterdayDate()) // NOTE: default to yesterday if no inbox zero start date
      )
      .reverse()
      .sortBy("date");

  const tabs: ClientInboxTabType[] = [
    {
      title: "Important",
      folderId: FOLDER_IDS.INBOX,
      gmailQuery: gmailFetchQueryImportant,
      outlookQuery: outlookFetchQueryImportant,
      filterThreadsFnc: filterThreadsFncImportant,
      canArchiveThread: true,
      canTrashThread: true,
    },
    {
      title: "Other",
      folderId: FOLDER_IDS.INBOX,
      gmailQuery: gmailFetchQueryImportant,
      outlookQuery: outlookFetchQueryImportant,
      filterThreadsFnc: filterThreadsFncOther,
      canArchiveThread: true,
      canTrashThread: true,
    },
  ];
  return <InboxThreadView tabs={tabs} />;
}
