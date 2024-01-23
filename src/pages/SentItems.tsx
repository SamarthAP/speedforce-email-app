import ThreadView from "../components/ThreadViews/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { OUTLOOK_SELECT_THREADLIST } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import React from "react";
import Titlebar from "../components/Titlebar";
import { useEmailPageOutletContext } from "./_emailPage";
import { useInfiniteQuery, useQuery } from "react-query";
import { getThreadsExhaustive } from "../api/gmail/reactQuery/reactQueryFunctions";

const filterThreadsFnc = (selectedEmail: ISelectedEmail) =>
  db.emailThreads
    .where("email")
    .equals(selectedEmail.email)
    .and(
      (thread) =>
        thread.labelIds.includes(FOLDER_IDS.SENT) &&
        !thread.labelIds.includes(FOLDER_IDS.TRASH)
    )
    .reverse()
    .sortBy("date");

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function SentItems() {
  const { selectedEmail } = useEmailPageOutletContext();

  const email = selectedEmail.email;
  const gmailQueryParam = "labelIds=SENT";
  const outlookQueryParam = `mailFolders/SentItems/messages?${OUTLOOK_SELECT_THREADLIST}&$top=20`;

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery(
    ["sent", email],
    ({ pageParam = "" }) =>
      getThreadsExhaustive(
        email,
        selectedEmail.provider,
        selectedEmail.provider === "google"
          ? gmailQueryParam
          : outlookQueryParam,
        ["ID_SENT"],
        pageParam
      ),
    {
      getNextPageParam: (lastPage, pages) => {
        return lastPage;
      },
    }
  );

  return (
    <ThreadView
      data={{
        title: "Sent",
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
  );
}
