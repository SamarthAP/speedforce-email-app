// import * as ReactDOM from "react-dom";

// function render() {
//   ReactDOM.render(<h2>Hello from React!</h2>, document.body);
// }

// render();

import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeContext } from "./contexts/ThemeContext";
import AppRouter from "./routing/AppRouter";

const container = document.getElementById("root");
const root = createRoot(container); // createRoot(container!) if you use TypeScript

function App() {
  const [theme, setTheme] = useState(() => {
    const localTheme = localStorage.getItem("theme");
    if (localTheme === "dark") {
      return "dark";
    }
    if (localTheme === "light") {
      return "light";
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      // theme isn't set, but OS is dark
      return "dark";
    }
    return "light"; // default to light
  });

  const themeValue = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <div className={`${theme}`}>
      <ThemeContext.Provider value={themeValue}>
        <AppRouter />
      </ThemeContext.Provider>
    </div>
  );
}

root.render(<App />);
