import { useEffect, useRef } from "react";
import { addQuoteToggleButton } from "../lib/shadowHelpers";
import { useThemeContext } from "../contexts/ThemeContext";
import {
  DISALLOWED_TAGS,
  applyDarkModeToElement,
} from "../lib/colorMod/colorConversion";
import { dLog } from "../lib/noProd";

interface ShadowDomProps {
  htmlString: string;
  showImages: boolean;
}
// doesn't use querySelectorAll, recureses through all children
function recursivelyApplyDarkMode(element: HTMLElement): void {
  if (DISALLOWED_TAGS.indexOf(element.tagName) > -1) {
    return;
  }

  const attributeName = `data-dark-decoration`;
  const decorated = element.hasAttribute(attributeName);

  if (!decorated) {
    // NOTE: gotta go deep first, since applying the other way stacks the styles and the colors filter on top of each other
    for (const child of element.children) {
      recursivelyApplyDarkMode(child as HTMLElement);
    }

    const results = applyDarkModeToElement(element);

    element.setAttribute(attributeName, "true");

    if (!results || results.length !== 3) {
      dLog("Unexpected results applying dark mode to email", results);
      return;
    }

    element.style.backgroundColor = results[0];
    element.style.borderColor = results[1];
    element.style.color = results[2];
  }
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

      const emailContentDiv = document.createElement("div");
      emailContentDiv.innerHTML = htmlString;

      const links = emailContentDiv.querySelectorAll("a");
      links.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          window.electron.ipcRenderer.sendMessage(
            "open-link-in-browser",
            link.href
          );
        });
      });

      if (!showImages) {
        const images = emailContentDiv.querySelectorAll("img");
        images.forEach((image) => {
          image.remove();
        });
      }

      addQuoteToggleButton(emailContentDiv);

      emailContainer.appendChild(emailContentDiv);

      emailContainer
        .querySelectorAll("script")
        .forEach((element) => element.remove());

      shadowRoot.appendChild(emailContainer);

      if (theme === "dark") {
        recursivelyApplyDarkMode(
          shadowRoot.getElementById("speedforce-email-container") as HTMLElement
        );
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
