import { useState, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useKeyPressContext } from "../contexts/KeyPressContext";

/**
 * Custom hook to detect a sequence of key presses.
 *
 * @param {string} firstKey - The first key in the sequence.
 * @param {string} secondKey - The second key in the sequence.
 * @param {Function} action - The action to perform after the sequence is detected.
 * @param {number} [resetDelay=1000] - The delay in milliseconds to reset the sequence detection.
 */
const useKeyPressSequence = (
  firstKey: string,
  secondKey: string,
  action: () => void,
  resetDelay = 1000
) => {
  const [firstKeyPressed, setFirstKeyPressed] = useState(false);
  const { setSequenceInitiated } = useKeyPressContext();

  // Reset firstKeyPressed after a delay or after the action is completed
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (firstKeyPressed) {
      timer = setTimeout(() => {
        setFirstKeyPressed(false);
      }, resetDelay);
    }
    return () => clearTimeout(timer);
  }, [firstKeyPressed, resetDelay]);

  // Detect first key press
  useHotkeys(
    firstKey,
    () => {
      setSequenceInitiated(true);
      setFirstKeyPressed(true);
    },
    [firstKeyPressed, setSequenceInitiated]
  );

  // Detect the second key press and perform action if the first key was pressed
  useHotkeys(
    secondKey,
    () => {
      if (firstKeyPressed) {
        action();
        setFirstKeyPressed(false);
      }
    },
    [firstKeyPressed, action, setFirstKeyPressed]
  );
};

export default useKeyPressSequence;
