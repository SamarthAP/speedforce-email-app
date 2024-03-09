import { useNavigate } from "react-router-dom";
import useKeyPressSequence from "../../hooks/hotkeys";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../../lib/shortcuts";

export default function GoToPageHotkeys({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  useKeyPressSequence(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "i", () => {
    navigate("/");
  });

  useKeyPressSequence(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "o", () => {
    navigate("/other");
  });

  useKeyPressSequence(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "s", () => {
    navigate("/starred");
  });

  useKeyPressSequence(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "t", () => {
    navigate("/sent");
  });

  useKeyPressSequence(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "d", () => {
    navigate("/drafts");
  });

  useKeyPressSequence(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "e", () => {
    navigate("/done");
  });

  useKeyPressSequence(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO],
    "shift+1", // "!"
    () => {
      navigate("/spam");
    }
  );

  useKeyPressSequence(
    DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO],
    "shift+3", // "#"
    () => {
      navigate("/deleted");
    }
  );

  return <>{children}</>;
}
