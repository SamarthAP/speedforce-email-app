import { FOLDER_IDS } from "../api/constants";
import { OUTLOOK_SELECT_THREADLIST } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import InboxThreadView from "../components/ThreadViews/InboxThreadView";
import { useEmailPageOutletContext } from "./_emailPage";
import { useInfiniteQuery } from "react-query";
import { useHotkeys } from "react-hotkeys-hook";
import { getThreadsExhaustive } from "../api/gmail/reactQuery/reactQueryFunctions";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";
import { useNavigate } from "react-router-dom";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";

interface OtherProps {
  inboxZeroStartDate: number;
}

export default function Other({ inboxZeroStartDate }: OtherProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const navigate = useNavigate();
  const email = selectedEmail.email;

  const filterThreadsFncOther = (selectedEmail: ISelectedEmail) =>
    db.emailThreads
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

  // get the `after` date in YYYY/MM/DD format, which is the day before the inbox zero start date
  // this is because gmail does not have an inclusive query param for dates
  const afterDate = new Date(selectedEmail.inboxZeroStartDate - 86400000)
    .toISOString()
    .split("T")[0];

  const gmailQueryParam = `q=label:INBOX -((category:personal) OR from:(${email}) OR from:"via Google") after:${afterDate}`;
  const outlookQueryParam = `mailFolders/Inbox/messages?${OUTLOOK_SELECT_THREADLIST}&$top=20&$filter=receivedDateTime ge ${afterDate}T00:00:00Z`;
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery(
    ["other", email],
    ({ pageParam = "" }) =>
      getThreadsExhaustive(
        email,
        selectedEmail.provider,
        selectedEmail.provider === "google"
          ? gmailQueryParam
          : outlookQueryParam,
        ["ID_INBOX"],
        pageParam
      ),
    {
      getNextPageParam: (lastPage, pages) => {
        return lastPage;
      },
    }
  );

  useHotkeys(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SWITCH_TAB], () => {
    navigate("/");
  });

  return (
    <GoToPageHotkeys>
      <InboxThreadView
        data={{
          title: "Other",
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
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetching={isFetching}
        isFetchingNextPage={isFetchingNextPage}
        reactQueryData={data}
      />
    </GoToPageHotkeys>
  );
}
