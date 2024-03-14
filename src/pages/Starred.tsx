import ThreadView from "../components/ThreadViews/ThreadView";
import { FOLDER_IDS } from "../api/constants";
import { ISelectedEmail, db } from "../lib/db";
import { OUTLOOK_SELECT_THREADLIST } from "../api/outlook/constants";
import { useEmailPageOutletContext } from "./_emailPage";
import { useInfiniteQuery } from "react-query";
import { getThreadsExhaustive } from "../api/gmail/reactQuery/reactQueryFunctions";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";
import ShortcutsFloater from "../components/KeyboardShortcuts/ShortcutsFloater";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";

const filterThreadsFnc = (selectedEmail: ISelectedEmail) =>
  db.emailThreads
    .where("email")
    .equals(selectedEmail.email)
    .and(
      (thread) =>
        thread.labelIds.includes("STARRED") &&
        !thread.labelIds.includes(FOLDER_IDS.TRASH)
    )
    .reverse()
    .sortBy("date");

// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Starred() {
  const { selectedEmail } = useEmailPageOutletContext();

  const email = selectedEmail.email;
  const gmailQueryParam = "labelIds=STARRED";
  const outlookQueryParam = `messages?${OUTLOOK_SELECT_THREADLIST}&$top=20&$filter=flag/flagStatus eq 'flagged'`;

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery(
    ["starred", email],
    ({ pageParam = "" }) =>
      getThreadsExhaustive(
        email,
        selectedEmail.provider,
        selectedEmail.provider === "google"
          ? gmailQueryParam
          : outlookQueryParam,
        ["ID_STARRED"],
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
          title: "Starred",
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
      <ShortcutsFloater
        items={[
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_DOWN]],
            description: "Move Down",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_UP]],
            description: "Move Up",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR]],
            description: "Star",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SELECT]],
            description: "View Thread",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SEARCH]],
            description: "Search",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.COMPOSE]],
            description: "Compose",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "s"],
            isSequential: true,
            description: "Go to Starred",
          },
        ]}
      />
    </GoToPageHotkeys>
  );
}
