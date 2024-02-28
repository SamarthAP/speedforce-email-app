import ThreadView from "../components/ThreadViews/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { OUTLOOK_SELECT_THREADLIST } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import { useEmailPageOutletContext } from "./_emailPage";
import { getThreadsExhaustive } from "../api/gmail/reactQuery/reactQueryFunctions";
import { useInfiniteQuery, useQuery } from "react-query";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";

const filterThreadsFnc = (selectedEmail: ISelectedEmail) =>
  db.emailThreads
    .where("email")
    .equals(selectedEmail.email)
    .and(
      (thread) =>
        thread.labelIds.includes(FOLDER_IDS.SPAM) &&
        !thread.labelIds.includes(FOLDER_IDS.TRASH)
    )
    .reverse()
    .sortBy("date");

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Spam() {
  const { selectedEmail } = useEmailPageOutletContext();

  const email = selectedEmail.email;
  const gmailQueryParam = "labelIds=SPAM&includeSpamTrash=true";
  const outlookQueryParam = `mailFolders/JunkEmail/messages?${OUTLOOK_SELECT_THREADLIST}&$top=20`;

  useQuery(["trash", email], () =>
    getThreadsExhaustive(
      email,
      selectedEmail.provider,
      selectedEmail.provider === "google" ? gmailQueryParam : outlookQueryParam,
      ["ID_SPAM"]
    )
  );

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery(
    ["spam", email],
    ({ pageParam = "" }) =>
      getThreadsExhaustive(
        email,
        selectedEmail.provider,
        selectedEmail.provider === "google"
          ? gmailQueryParam
          : outlookQueryParam,
        ["ID_SPAM"],
        pageParam
      ),
    {
      getNextPageParam: (lastPage, pages) => {
        return lastPage;
      },
    }
  );

  return (
    <GoToPageHotkeys>
      <ThreadView
        data={{
          title: "Spam",
          filterThreadsFnc: filterThreadsFnc,
          canArchiveThread: true,
          canTrashThread: true,
        }}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetching={isFetching}
        isFetchingNextPage={isFetchingNextPage}
        reactQueryData={data}
      />
    </GoToPageHotkeys>
  );
}
