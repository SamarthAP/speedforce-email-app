import ThreadView from "../components/ThreadViews/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { OUTLOOK_SELECT_THREADLIST } from "../api/outlook/constants";
import { ISelectedEmail, db } from "../lib/db";
import React from "react";
import Titlebar from "../components/Titlebar";
import { useEmailPageOutletContext } from "./_emailPage";
import { useQuery } from "react-query";
import { getThreadsExhaustive } from "../api/gmail/reactQuery/reactQueryFunctions";

// const gmailFetchQuery = ``;
// const outlookFetchQuery = `mailFolders/${OUTLOOK_FOLDER_IDS_MAP.getValue(
//   FOLDER_IDS.DONE
// )}/messages?$select=id,conversationId,createdDateTime&$top=20`;

const filterThreadsFnc = (selectedEmail: ISelectedEmail) => {
  if (selectedEmail.provider === "google") {
    return db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and(
        (thread) =>
          !thread.labelIds.includes(FOLDER_IDS.INBOX) &&
          !thread.labelIds.includes(FOLDER_IDS.TRASH) &&
          !thread.labelIds.includes(FOLDER_IDS.DRAFTS)
      )
      .reverse()
      .sortBy("date");
  } else {
    return db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and((thread) => thread.labelIds.includes(FOLDER_IDS.DONE))
      .reverse()
      .sortBy("date");
  }
};

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Done() {
  const { selectedEmail } = useEmailPageOutletContext();

  const email = selectedEmail.email;
  const gmailQueryParam = "q=-label:inbox -label:draft";
  const outlookQueryParam = `mailFolders/Archive/messages?${OUTLOOK_SELECT_THREADLIST}&$top=20`;
  useQuery(["done", email], () =>
    getThreadsExhaustive(
      email,
      selectedEmail.provider,
      selectedEmail.provider === "google" ? gmailQueryParam : outlookQueryParam,
      ["ID_DONE"]
    )
  );

  return (
    <React.Fragment>
      <Titlebar />
      <div className="flex h-full overflow-hidden">
        <ThreadView
          data={{
            title: "Done",
            // folderId: FOLDER_IDS.DONE,
            filterThreadsFnc: filterThreadsFnc,
            canArchiveThread: false,
            canTrashThread: true,
          }}
        />
      </div>
    </React.Fragment>
  );
}
