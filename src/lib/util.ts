import { Base64 } from "js-base64";
import DomPurify from "dompurify";

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function cleanHtmlString(htmlString: string, encoded = false) {
  let decodedHTML = "";
  if (encoded) {
    decodedHTML = decodeGoogleMessageData(htmlString);
  } else {
    decodedHTML = htmlString;
  }

  const htmlWithBlobs = replaceDataURIsWithBlobs(decodedHTML);
  const sanitized = DomPurify.sanitize(htmlWithBlobs, {
    USE_PROFILES: { html: true, svg: false, mathMl: false },
  });
  return sanitized;
}

// Function to replace data URIs with blob URIs in an HTML string
function replaceDataURIsWithBlobs(htmlString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  const elementsWithDataURIs = doc.querySelectorAll('[src^="data:"]');
  elementsWithDataURIs.forEach((element) => {
    const dataURI = element.getAttribute("src");
    if (!dataURI) {
      return;
    }

    const mimeTypeMatches = dataURI.match(/^data:(.*?)(;base64)?,/);
    if (!mimeTypeMatches) {
      return;
    }

    const mimeType = mimeTypeMatches[1];
    const isBase64 = /;base64/.test(dataURI);

    if (isBase64) {
      const data = Base64.atob(dataURI.split(",")[1]);
      const arrayBuffer = new ArrayBuffer(data.length);
      const uint8Array = new Uint8Array(arrayBuffer);

      for (let i = 0; i < data.length; i++) {
        uint8Array[i] = data.charCodeAt(i);
      }

      const blob = new Blob([uint8Array], { type: mimeType });
      const blobURL = URL.createObjectURL(blob);

      element.setAttribute("src", blobURL);
    }
  });

  return doc.documentElement.outerHTML;
}

export function decodeGoogleMessageData(data: string) {
  // return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
  return Base64.decode(data.replace(/-/g, "+").replace(/_/g, "/"));
}

export function getMessageHeader(
  headers: {
    name: string;
    value: string;
  }[],
  name: string
) {
  return (
    headers.filter(
      (header) => header.name.toLowerCase() === name.toLowerCase()
    )[0]?.value || ""
  );
}

export function upsertLabelIds(labelIds: string[], labelId: string) {
  const i = labelIds.indexOf(labelId);
  if (i === -1) {
    labelIds.push(labelId);
  }

  return labelIds;
}

export function formatDateForForwardTemplate(date: Date) {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function extractTextFromNode(node: Node, textNodes: string[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.textContent && node.textContent.trim().length > 0) {
      textNodes.push(node.textContent);
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    for (const child of node.childNodes) {
      extractTextFromNode(child, textNodes);
    }
  }
}

export function extractTextFromHTML(html: string) {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll("style, script").forEach((element) => element.remove());

  const textNodes: string[] = [];

  for (const child of div.childNodes) {
    extractTextFromNode(child, textNodes);
  }

  return textNodes.join("-");
}
