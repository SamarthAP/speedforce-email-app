import { useEffect, useRef } from "react";
import { addQuoteToggleButton } from "../../lib/shadowHelpers";

interface ShadowDomProps {
  htmlString: string;
}

export default function ShadowDom({ htmlString }: ShadowDomProps) {
  const shadowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shadowRef.current) {
      shadowRef.current.shadowRoot
        ?.getElementById("speedforce-email-container")
        ?.remove();

      const shadowRoot = shadowRef.current.shadowRoot
        ? shadowRef.current.shadowRoot
        : shadowRef.current.attachShadow({ mode: "open" });

      const emailContainer = document.createElement("div");
      emailContainer.id = "speedforce-email-container";

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

      addQuoteToggleButton(emailContentDiv);

      emailContainer.appendChild(emailContentDiv);

      emailContainer
        .querySelectorAll("script")
        .forEach((element) => element.remove());

      shadowRoot.appendChild(emailContainer);
    }
  }, [htmlString]);

  return <div ref={shadowRef}></div>;
}
