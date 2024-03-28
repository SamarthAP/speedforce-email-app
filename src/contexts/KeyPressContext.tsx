import { createContext, useState, useContext } from "react";

// Create context
const KeyPressContext = createContext({
  sequenceInitiated: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  setSequenceInitiated: (_sequenceInitiated: boolean) => {},
});

// Create a custom hook for easy context consumption
export const useKeyPressContext = () => useContext(KeyPressContext);

// Provider component
export const KeyPressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sequenceInitiated, setSequenceInitiated] = useState(false);

  // The value that will be passed to consumers
  const value = {
    sequenceInitiated,
    setSequenceInitiated,
  };

  return (
    <KeyPressContext.Provider value={value}>
      {children}
    </KeyPressContext.Provider>
  );
};
