import { useEffect, useRef } from "react";
import { addQuoteToggleButton } from "../lib/shadowHelpers";
import { useThemeContext } from "../contexts/ThemeContext";

interface ShadowDomProps {
  htmlString: string;
}

export default function ShadowDom({ htmlString }: ShadowDomProps) {
  const shadowRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeContext();

  useEffect(() => {
    if (shadowRef.current) {
      const shadowRoot = shadowRef.current.attachShadow({ mode: "open" });
      const emailContainer = document.createElement("div");
      emailContainer.style.fontSize = "0.875rem";

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      doc.body.style.margin = "0";
      doc.body.style.padding = "0";

      addQuoteToggleButton(doc);

      emailContainer.appendChild(doc.body);
      shadowRoot.appendChild(emailContainer);
    }
  }, [htmlString]);

  useEffect(() => {
    if (shadowRef.current) {
      const body = shadowRef.current.shadowRoot?.querySelector(
        "body"
      ) as HTMLBodyElement;
      if (body) {
        if (theme === "dark") {
          body.style.backgroundColor = "rgb(24 24 27)";
          body.style.color = "#fff";
        } else {
          body.style.backgroundColor = "#fff";
          body.style.color = "#000";
        }
      }
    }
  }, [theme]);

  return (
    <div
      className="dark:bg-zinc-900 w-full overflow-x-scroll"
      ref={shadowRef}
    />
  );
}
