import { useContext, createContext } from "react";

export const ThemeContext = createContext({
  theme: "light",
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  setTheme: (_theme: string) => {},
});

export function useThemeContext() {
  return useContext(ThemeContext);
}
