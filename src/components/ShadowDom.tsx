import { useEffect, useRef } from "react";
import { addQuoteToggleButton } from "../lib/shadowHelpers";
import { useThemeContext } from "../contexts/ThemeContext";
import { applyDarkModeToElement } from "../lib/colorMod/colorConversion";
import { dLog } from "../lib/noProd";

interface ShadowDomProps {
  htmlString: string;
  showImages: boolean;
}

export default function ShadowDom({ htmlString, showImages }: ShadowDomProps) {
  const shadowRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeContext();

  useEffect(() => {
    if (shadowRef.current) {
      // in order to rerender the shadow dom, we need to remove the old one
      shadowRef.current.shadowRoot
        ?.getElementById("speedforce-email-container")
        ?.remove();
      const shadowRoot = shadowRef.current.shadowRoot
        ? shadowRef.current.shadowRoot
        : shadowRef.current.attachShadow({ mode: "open" });
      const emailContainer = document.createElement("div");
      emailContainer.id = "speedforce-email-container";
      emailContainer.style.fontSize = "0.875rem"; // text-sm 14px

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      doc.body.style.margin = "0";
      doc.body.style.padding = "0";

      const links = doc.querySelectorAll("a");
      links.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          window.electron.ipcRenderer.sendMessage(
            "open-link-in-browser",
            link.href
          );
        });
      });

      // remove images
      if (!showImages) {
        const images = doc.querySelectorAll("img");
        images.forEach((image) => {
          image.remove();
        });
      }

      addQuoteToggleButton(doc);

      emailContainer.appendChild(doc.body);
      emailContainer
        .querySelectorAll("script")
        .forEach((element) => element.remove());
      shadowRoot.appendChild(emailContainer);

      const elements = shadowRoot.querySelectorAll("*");

      for (const element of elements) {
        if (theme === "dark") {
          const results = applyDarkModeToElement(element as HTMLElement);

          if (!results || results.length !== 3) {
            dLog("Unexpected results applying dark mode to email", results);
            continue;
          }

          (element as HTMLElement).style.backgroundColor = results[0];
          (element as HTMLElement).style.borderColor = results[1];
          (element as HTMLElement).style.color = results[2];
        }
      }
    }
  }, [htmlString, showImages, theme]);

  return (
    <div
      className="bg-white dark:bg-zinc-900 w-full overflow-x-scroll hide-scroll"
      ref={shadowRef}
    />
  );
}
