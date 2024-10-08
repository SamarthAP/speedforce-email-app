// enum of actions
export enum KEYBOARD_ACTIONS {
  COMMAND = "COMMAND",
  MOVE_UP = "MOVE_UP",
  MOVE_DOWN = "MOVE_DOWN",
  ARROW_UP = "ARROW_UP",
  ARROW_DOWN = "ARROW_DOWN",
  //
  MARK_DONE = "MARK_DONE",
  STAR = "STAR",
  UNSUBSCRIBE = "UNSUBSCRIBE",
  //
  COMPOSE = "COMPOSE",
  SELECT = "SELECT",
  SEARCH = "SEARCH",
  ESCAPE = "ESCAPE",
  SWITCH_TAB = "SWITCH_TAB",
  GO_TO = "GO_TO",
}
export const DEFAULT_KEYBINDS = {
  [KEYBOARD_ACTIONS.COMMAND]: "metaKey",
  [KEYBOARD_ACTIONS.MOVE_UP]: "k",
  [KEYBOARD_ACTIONS.MOVE_DOWN]: "j",
  [KEYBOARD_ACTIONS.ARROW_UP]: "ArrowUp",
  [KEYBOARD_ACTIONS.ARROW_DOWN]: "ArrowDown",
  //
  [KEYBOARD_ACTIONS.MARK_DONE]: "e",
  [KEYBOARD_ACTIONS.STAR]: "s",
  [KEYBOARD_ACTIONS.UNSUBSCRIBE]: "u",
  //
  [KEYBOARD_ACTIONS.COMPOSE]: "c",
  [KEYBOARD_ACTIONS.SELECT]: "Enter",
  [KEYBOARD_ACTIONS.SEARCH]: "/",
  [KEYBOARD_ACTIONS.ESCAPE]: "Escape",
  [KEYBOARD_ACTIONS.SWITCH_TAB]: "Tab",
  [KEYBOARD_ACTIONS.GO_TO]: "g",
};
