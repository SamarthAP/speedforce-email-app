import SharedDraftsThreadView from "../components/ThreadViews/SharedDraftsThreadView";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";
import ShortcutsFloater from "../components/KeyboardShortcuts/ShortcutsFloater";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";

export default function SharedDrafts() {
  return (
    <GoToPageHotkeys>
      <SharedDraftsThreadView />
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
