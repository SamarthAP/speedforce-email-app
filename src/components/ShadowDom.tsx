import { useEffect, useRef } from "react";
import { addQuoteToggleButton } from "../lib/shadowHelpers";
import { useThemeContext } from "../contexts/ThemeContext";

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
      emailContainer.style.fontSize = "0.875rem";

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
        // if no style color is set, set it to blue
        if (!link.style.color) {
          link.style.color = "#2563eb"; // text-blue-500
        }
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
    }
  }, [htmlString, showImages]);

  // Note: do not remove, keep as reference
  // useEffect(() => {
  //   if (shadowRef.current) {
  //     const body = shadowRef.current.shadowRoot?.querySelector(
  //       "body"
  //     ) as HTMLBodyElement;
  //     if (body) {
  //       if (theme === "dark") {
  //         body.style.backgroundColor = "rgb(24 24 27)";
  //         body.style.color = "#fff";
  //       } else {
  //         body.style.backgroundColor = "#fff";
  //         body.style.color = "#000";
  //       }
  //     }
  //   }
  // }, [theme]);

  return (
    <div
      className="bg-white p-4 w-full overflow-x-scroll hide-scroll"
      ref={shadowRef}
    />
  );
}
