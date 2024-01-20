import InboxThreadView from "../components/ThreadViews/InboxThreadView";
import { FOLDER_IDS } from "../api/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import { ClientInboxTabType } from "../api/model/client.inbox";
import { useEmailPageOutletContext } from "./_emailPage";
import { useQuery } from "react-query";
import { getThreadsExhaustive } from "../api/gmail/reactQuery/reactQueryFunctions";

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

  const { selectedEmail } = useEmailPageOutletContext();

  const email = selectedEmail.email;
  // get the `after` date in YYYY/MM/DD format, which is the day before the inbox zero start date
  // this is because gmail does not have an inclusive query param for dates
  const afterDate = new Date(selectedEmail.inboxZeroStartDate - 86400000)
    .toISOString()
    .split("T")[0];
  const gmailQueryParam = `q=label:INBOX ((category:personal) OR from:(${email}) OR from:"via Google") after:${afterDate}`;
  const outlookQueryParam =
    "mailFolders/Inbox/messages?$select=id,conversationId,createdDateTime&$top=20";
  useQuery(["inbox", email], () =>
    getThreadsExhaustive(
      email,
      selectedEmail.provider,
      selectedEmail.provider === "google" ? gmailQueryParam : outlookQueryParam,
      ["ID_INBOX"]
    )
  );

  return (
    <InboxThreadView
      data={{
        title: "Important",
        // folderId: FOLDER_IDS.INBOX,
        filterThreadsFnc: filterThreadsFncImportant,
        canArchiveThread: true,
        canTrashThread: true,
      }}
      tabs={[
        {
          title: "Important",
          href: "/",
        },
        {
          title: "Other",
          href: "/other",
        },
      ]}
    />
  );
}
