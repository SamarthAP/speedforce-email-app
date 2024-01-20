import { FOLDER_IDS } from "../api/constants";
import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_FOLDER_IDS_MAP } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import InboxThreadView from "../components/ThreadViews/InboxThreadView";
import { useEmailPageOutletContext } from "./_emailPage";
import { useQuery } from "react-query";
import { getThreadsExhaustive } from "../api/gmail/reactQuery/reactQueryFunctions";

const gmailFetchQueryOther = `&labelIds=${GMAIL_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.INBOX
)}`;
const outlookFetchQueryOther = `mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
  FOLDER_IDS.INBOX
)}/messages?$select=id,conversationId,createdDateTime&$top=20`;

interface OtherProps {
  inboxZeroStartDate: number;
}

export default function Other({ inboxZeroStartDate }: OtherProps) {
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
          thread.date >= inboxZeroStartDate
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
  const gmailQueryParam = `q=label:INBOX -((category:personal) OR from:(${email}) OR from:"via Google") after:${afterDate}`;
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
        title: "Other",
        // folderId: FOLDER_IDS.INBOX,
        filterThreadsFnc: filterThreadsFncOther,
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
