import { Base64 } from "js-base64";
import DomPurify from "dompurify";
import { db, IEmailThread, IMessage } from "./db";
import { dLog } from "./noProd";
import { FOLDER_IDS } from "../api/constants";
// import { GMAIL_FOLDER_IDS_MAP } from "../api/gmail/constants";
import { OUTLOOK_SELECT_THREADLIST } from "../api/outlook/constants";
import toast from "react-hot-toast";
import { sendEmail } from "./sync";
import { unsubscribe } from "../api/emailActions";
// import { BidirectionalMap } from "../api/model/bidirectionalMap";

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function cleanHtmlString(htmlString: string) {
  const htmlWithBlobs = replaceDataURIsWithBlobs(htmlString);
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

// Specify a list of labels to add or remove from a thread
// Example use case: Archiving a thread means removeing INBOX,SENT,etc. and adding ARCHIVE
export async function updateLabelIdsForEmailThread(
  threadId: string,
  addLabelIds: string[],
  removeLabelIds: string[]
) {
  const thread = await db.emailThreads.get(threadId);
  if (!thread) {
    dLog("no thread");
    return;
  }

  const labelIds = thread.labelIds
    .filter((labelId) => !removeLabelIds?.includes(labelId))
    .concat(addLabelIds);

  await db.emailThreads.update(threadId, { labelIds });
}

export async function deleteDexieThread(threadId: string) {
  await db.emailThreads.delete(threadId);
  await db.messages.where("threadId").equals(threadId).delete();
}

export async function addDexieThread(thread: IEmailThread) {
  await db.emailThreads.put(thread);
}

export async function updateDexieDraft(
  thread: IEmailThread,
  message: IMessage
) {
  await db.emailThreads.update(thread.id, thread);
  await db.messages.update(message.id, message);
}

export function getSnippetFromHtml(html: string) {
  const text = extractTextFromHTML(html);
  return text.slice(0, 100);
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function outlookGetFolderNameFromSearchQuery(folder: string) {
  switch (folder) {
    case "inbox":
      return "Inbox";
    case "sent":
      return "SentItems";
    case "drafts":
      return "Drafts";
    case "archive":
      return "Archive";
    case "trash":
      return "DeletedItems";
    default:
      return "Inbox";
  }
}

export function getFolderIdFromSearchFolder(
  provider: "google" | "outlook",
  folder: string
) {
  switch (folder) {
    case "inbox":
      return FOLDER_IDS.INBOX;
    case "sent":
      return FOLDER_IDS.SENT;
    case "drafts":
      return FOLDER_IDS.DRAFTS;
    case "archive":
      return FOLDER_IDS.DONE;
    case "trash":
      return FOLDER_IDS.TRASH;
    case "starred":
      return FOLDER_IDS.STARRED;
    default:
      return FOLDER_IDS.INBOX;
  }
}

export function buildSearchQuery(
  provider: "google" | "outlook",
  searchItems: string[]
) {
  if (provider === "google") {
    const filters: string[] = [];

    for (const item of searchItems) {
      if (item.startsWith("in:")) {
        filters.push(item);
      } else if (item.startsWith("from:") || item.startsWith("to:")) {
        // To/from filters can be pushed as plain strings "to:query" or "from:query"
        filters.push(item);
      } else {
        // If action not recognized, push as a plain string
        filters.push(item);
      }
    }

    return `&includeSpamTrash=true&q=${filters.join(" ")}`;
  } else if (provider === "outlook") {
    let folderId = "";
    const filters: string[] = [];
    const queryParams: Map<string, string[]> = new Map(); // Misc query params

    for (const item of searchItems) {
      if (item.startsWith("in:")) {
        const folder = item.slice(3);
        // Set the folder id of the search query, default to /messages
        if (folder === "starred") {
          const filterParam = queryParams.get("$filter") || [];
          queryParams.set(
            "$filter",
            filterParam.concat("flag/flagStatus eq 'flagged'")
          );
        } else {
          folderId = `mailFolders/${outlookGetFolderNameFromSearchQuery(
            folder
          )}/`;
        }
      } else if (item.startsWith("from:") || item.startsWith("to:")) {
        // To/from filters can be pushed as plain strings "to:query" or "from:query"
        filters.push(item);
      } else {
        // If action not recognized, push as a plain string
        filters.push(item);
      }
    }

    let queryString = "";
    queryParams.forEach((value, key) => {
      queryString += `&${key}=${value.join(" and ")}`;
    });

    return `${folderId}messages?${OUTLOOK_SELECT_THREADLIST}&$top=20${queryString}${
      filters.length > 0 ? '&$search="' + filters.join(" AND ") + '"' : ""
    }`;
  }

  return "";
}

export async function saveSearchQuery(email: string, searchItems: string[]) {
  const parsedQuery = searchItems.join(" ");
  const searchQuery = await db.searchHistory
    .where("email")
    .equals(email)
    .and((query) => query.searchQuery == parsedQuery)
    .first();
  dLog("saving search query");
  await db.searchHistory.put({
    email,
    searchQuery: parsedQuery,
    lastInteraction: new Date().getTime(),
    numInteractions: searchQuery ? searchQuery.numInteractions + 1 : 1,
  });
}

export function parseSearchQuery(searchQuery: string) {
  // TODO: improve to accomodate edge cases
  return searchQuery
    ? searchQuery
        .split(" ")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];
}

export async function listUnsubscribe(
  listUnsubscribeHeader: string,
  email: string,
  provider: "google" | "outlook"
) {
  toast("Unsubscribing...");
  const unsubscribeLink = listUnsubscribeHeader.match(/<(http[^>]+)>/)?.[1];
  const unsubscribeEmail = listUnsubscribeHeader.match(/<(mailto:[^>]+)>/)?.[1];

  if (unsubscribeLink) {
    try {
      const { error } = await unsubscribe(unsubscribeLink);

      if (error) {
        toast("Failed to unsubscribe from mailing list");
      } else {
        toast("Successfully unsubscribed from mailing list");
      }
    } catch (e) {
      dLog("error unsubscribing from email list", e);
    }
  } else if (unsubscribeEmail && unsubscribeEmail[1]) {
    // example unsubscribeEmail: mailto:1axc2so6ift9r23tp588nei39vc4fi1a4yzk3i-samarth=payswift.ca@bf08x.hubspotemail.net?subject=unsubscribe
    const mailtoURI = unsubscribeEmail[1];

    const emailWithParams = mailtoURI.replace("mailto:", "");
    const cleanedUnsubscribeEmail = emailWithParams.split("?")[0]; // removes query params from the mailto link

    const { error } = await sendEmail(
      email,
      provider,
      [cleanedUnsubscribeEmail],
      [],
      [],
      "Unsubscribe",
      "<div>Please unsubscribe me from this list.</div>"
    );

    if (error) {
      dLog("error sending email to cancel subscription to email list", error);
    } else {
      toast("Successfully unsubscribed from mailing list");
    }
  }
}
