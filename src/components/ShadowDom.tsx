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

      // if (theme === "dark") {
      //   emailContainer.style.backgroundColor = "rgb(24,24,24)";
      // } else {
      //   emailContainer.style.backgroundColor = "rgb(255,255,255)";
      // }
      console.log("harry email", emailContainer);

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");

      const bodies = doc.querySelectorAll("body");
      bodies?.forEach((body) => {
        if (body) {
          if (body.tagName === "a" || body instanceof HTMLAnchorElement) {
            return;
          }
          if (theme === "dark") {
            // body.style.backgroundColor = "rgb(24 24 27)";
            // if (body.style.backgroundColor) {
            //   if (body.nodeType == Node.TEXT_NODE) {
            //     // change the background color of the parent element of the child to be transparent
            //     const parentElement = body.parentNode;
            //     if (parentElement instanceof HTMLElement) {
            //       parentElement.style.backgroundColor = "transparent";
            //     }
            //   } else {
            //     if (body.nodeType == Node.TEXT_NODE) {
            //       // change the background color of the parent element of the child to be transparent
            //       const parentElement = body.parentNode;
            //       if (parentElement instanceof HTMLElement) {
            //         parentElement.style.backgroundColor = "transparent";
            //       }
            //     } else {
            //       // const darkenedColor = darkenColor(
            //       //   body.style.backgroundColor,
            //       //   0.2
            //       // ); // Darken the color by 20%
            //       // body.style.backgroundColor = darkenedColor;
            //     }
            //   }
            // } else {
            //   if (body.nodeType == Node.TEXT_NODE) {
            //     // change the background color of the parent element of the child to be transparent
            //     const parentElement = body.parentNode;
            //     // Change the background color of the parent element to be transparent
            //     if (parentElement instanceof HTMLElement) {
            //       parentElement.style.backgroundColor = "transparent";
            //     }
            //   }
            // }
            // if (body.nodeType == Node.TEXT_NODE) {
            //   const parentElement = body.parentNode;
            //   if (parentElement instanceof HTMLElement) {
            //     parentElement.style.backgroundColor = "transparent";
            //   }
            // }
            body.style.backgroundColor = "rbg(24,24,24)";
            body.style.color = "#fff";
          }
          // else {
          //   body.style.backgroundColor = "rbg(255,255,255)";
          //   body.style.color = "#000";
          // }
        }
        const children = body.querySelectorAll("*");
        children.forEach((child) => {
          if (child.tagName === "a" || child instanceof HTMLAnchorElement) {
            return;
          }
          if (child instanceof HTMLElement) {
            // if (child.tagName === "a") {
            //   return;
            // }
            if (theme === "dark") {
              if (
                child.style.backgroundColor &&
                child.style.backgroundColor !== "transparent"
              ) {
                if (child.nodeType === Node.TEXT_NODE) {
                  // change the background color of the parent element of the child to be transparent
                  const parentElement = child.parentNode;
                  if (parentElement instanceof HTMLElement) {
                    parentElement.style.backgroundColor = "transparent";
                  }
                } else if (child.tagName === "SPAN") {
                  child.style.backgroundColor = "transparent";
                } else {
                  const darkenedColor = darkenColor(
                    child.style.backgroundColor,
                    0.2
                  ); // Darken the color by 20%
                  child.style.backgroundColor = darkenedColor;
                  // child.style.backgroundColor = "transparent";
                }
              } else {
                if (child.nodeType == Node.TEXT_NODE) {
                  const parentElement = child.parentNode;
                  if (parentElement instanceof HTMLElement) {
                    parentElement.style.backgroundColor = "transparent";
                  }
                  child.style.backgroundColor = "rgb(24 24 27)";
                }
              }

              child.style.color = "#fff";

              // child.style.borderColor = "rgb(24 24 27)";
            }
            // else {
            //   child.style.backgroundColor = "rgb(255, 255, 255)";
            //   child.style.color = "#000";
            //   // child.style.borderColor = "#fff";
            // }
          }
        });
      });

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
      console.log("harry doc", doc.body);

      addQuoteToggleButton(doc);

      emailContainer.appendChild(doc.body);
      emailContainer
        .querySelectorAll("script")
        .forEach((element) => element.remove());
      shadowRoot.appendChild(emailContainer);
    }
  }, [htmlString, showImages, theme]);

  // Note: do not remove, keep as reference
  // useEffect(() => {
  //   if (shadowRef.current) {
  //     const bodies = shadowRef.current.shadowRoot?.querySelectorAll("body");
  //     console.log("REASSIGN");
  //     bodies?.forEach((body) => {
  //       if (body) {
  //         if (theme === "dark") {
  //           body.style.backgroundColor = "rgb(24 24 27)";
  //           body.style.color = "#fff";
  //           // body.style.borderColor = "rgb(24 24 27)";
  //         } else {
  //           body.style.backgroundColor = "rbg(255,255,255)";
  //           body.style.color = "#000";
  //           // body.style.borderColor = "#fff";
  //         }
  //       }
  //       const children = body.querySelectorAll("*");
  //       children.forEach((child) => {
  //         if (child instanceof HTMLElement) {
  //           if (theme === "dark") {
  //             child.style.backgroundColor = "rgb(24, 24, 27)";
  //             child.style.color = "#fff";
  //             // child.style.borderColor = "rgb(24 24 27)";
  //           } else {
  //             child.style.backgroundColor = "rgb(255, 255, 255)";
  //             child.style.color = "#000";
  //             // child.style.borderColor = "#fff";
  //           }
  //         }
  //       });
  //     });
  //   }
  // }, [theme]);

  function rgbToHsl(r: any, g: any, b: any) {
    (r /= 255), (g /= 255), (b /= 255);
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0;
    let s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [h, s, l];
  }

  function hslToRgb(h: any, s: any, l: any) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: any, q: any, t: any) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function darkenColor(rgb: any, amount: any) {
    const matches = rgb.match(/\d+/g);
    if (!matches || matches.length !== 3) {
      return rgb; // Return original color if input is not in correct format
    }
    const r = parseInt(matches[0]);
    const g = parseInt(matches[1]);
    const b = parseInt(matches[2]);

    const [h, s, l] = rgbToHsl(r, g, b);
    const newL = Math.max(0, l - amount); // Reduce lightness by specified amount
    const [newR, newG, newB] = hslToRgb(h, s, newL);
    return `rgb(${newR}, ${newG}, ${newB})`;
  }

  /*  Example usage
  const originalColor = "rgb(24, 24, 27)";
  const darkenedColor = darkenRgbColor(originalColor, 0.2); // Darken the color by 20%
  console.log('Darkened color:', darkenedColor); // Output the darkened color in rgb format
  */

  return (
    <div
      className="bg-white dark:bg-zinc-900 p-4 w-full overflow-x-scroll hide-scroll"
      ref={shadowRef}
    />
  );
}
