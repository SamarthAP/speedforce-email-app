import { OUTLOOK_SELECT_THREADLIST } from "../api/outlook/constants";
import { useEmailPageOutletContext } from "./_emailPage";
import { useInfiniteQuery } from "react-query";
import { getDraftsExhaustive } from "../api/gmail/reactQuery/reactQueryFunctions";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";
import ShortcutsFloater from "../components/KeyboardShortcuts/ShortcutsFloater";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";
import DraftsThreadView from "../components/ThreadViews/DraftsThreadView";

// TODO: May be able to abstract this away as well
// Possible that other pages have different functionality (e.g. Drafts?) so keeping this as a separate page for now
export default function Drafts() {
  const { selectedEmail } = useEmailPageOutletContext();

  const email = selectedEmail.email;
  const gmailQueryParam = "labelIds=DRAFT";
  const outlookQueryParam = `mailFolders/Drafts/messages?${OUTLOOK_SELECT_THREADLIST}&$top=20`;

  useInfiniteQuery(
    ["drafts", email],
    ({ pageParam = "" }) =>
      getDraftsExhaustive(
        email,
        selectedEmail.provider,
        selectedEmail.provider === "google"
          ? gmailQueryParam
          : outlookQueryParam,
        ["ID_DRAFTS"],
        pageParam
      ),
    {
      getNextPageParam: (lastPage, pages) => {
        return lastPage;
      },
      staleTime: 1000 * 60 * 1, // 1 min
    }
  );

  return (
    <GoToPageHotkeys>
      <DraftsThreadView />
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
