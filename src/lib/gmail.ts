import { gmail_v1 } from "../types/gmail";
import { Base64 } from "js-base64";
import { EmailMessage, EmailThread } from "../types/sync";

export function getMessageHeader(
  headers: gmail_v1.Schema$MessagePartHeader[],
  name: string
) {
  return (
    headers.filter(
      (header) => header.name?.toLocaleLowerCase() === name.toLowerCase()
    )[0]?.value || ""
  );
}

export function decodeGoogleMessageData(data: string) {
  // return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
  return Base64.decode(data.replace(/-/g, "+").replace(/_/g, "/"));
}

export interface ParsedAttachment {
  filename: string;
  mimeType: string;
  attachmentId: string;
  size: number;
}

export interface ParsedGmailMessage {
  historyId: string;
  messageId: string;
  threadId: string;
  labelIds: string[];
  subject: string;
  toRecipients: string[];
  from: string;
  ccRecipients: string[];
  bccRecipients: string[];
  textData: string;
  htmlData: string;
  date: number;
  attachments: ParsedAttachment[];
}

export function parseParts(
  message: gmail_v1.Schema$Message,
  parts: gmail_v1.Schema$MessagePart[] | undefined
) {
  let subject = "";
  let from = "";
  let textData = "";
  let htmlData = "";
  const attachments: ParsedAttachment[] = [];

  parts?.forEach((part) => {
    if (part.mimeType === "text/plain") {
      textData = decodeGoogleMessageData(part.body?.data || "");
    } else if (part.mimeType === "text/html") {
      htmlData = decodeGoogleMessageData(part.body?.data || "");
    }

    if (part.parts) {
      part.parts.forEach((nestedPart) => {
        if (nestedPart.mimeType === "text/plain") {
          textData = decodeGoogleMessageData(nestedPart.body?.data || "");
        } else if (nestedPart.mimeType === "text/html") {
          htmlData = decodeGoogleMessageData(nestedPart.body?.data || "");
        }
      });
    }

    if (part.filename && part.filename !== "") {
      attachments.push({
        filename: part.filename || "",
        mimeType: part.mimeType || "",
        attachmentId: part.body?.attachmentId || "",
        size: part.body?.size || 0,
      });
    }
  });

  if (htmlData === "") {
    htmlData = decodeGoogleMessageData(message.payload?.body?.data || "");
  }

  subject = getMessageHeader(message.payload?.headers || [], "Subject") || "";
  const toRecipients = getMessageHeader(message.payload?.headers || [], "To")
    .split(",")
    .map((recipient) => recipient.trim());
  from = getMessageHeader(message.payload?.headers || [], "From") || "";
  const ccRecipients = getMessageHeader(message.payload?.headers || [], "Cc")
    .split(",")
    .map((recipient) => recipient.trim());
  const bccRecipients = getMessageHeader(message.payload?.headers || [], "Bcc")
    .split(",")
    .map((recipient) => recipient.trim());
  const date = parseInt(message.internalDate);

  const parsedMessage: ParsedGmailMessage = {
    historyId: message.historyId || "",
    messageId: message.id || "",
    threadId: message.threadId || "",
    labelIds: message.labelIds || [],
    subject,
    toRecipients,
    from,
    ccRecipients,
    bccRecipients,
    textData,
    htmlData,
    date,
    attachments,
  };

  return parsedMessage;
}

export function extractGmailMessageData(
  message: gmail_v1.Schema$Message
): ParsedGmailMessage | null {
  const payload = message.payload;

  if (!payload) {
    return null;
  }

  const parts = payload.parts;

  return parseParts(message, parts);
}

export function parseGmailThreads(
  threads: gmail_v1.Schema$Thread[],
  email: string
) {
  const parsedThreads: EmailThread[] = [];

  for (const thread of threads) {
    const parsedMessages: EmailMessage[] = [];

    for (const message of thread.messages) {
      const parsedData = extractGmailMessageData(message);

      if (!parsedData) {
        continue;
      }

      parsedMessages.push({
        id: message.id,
        historyId: message.historyId,
        threadId: message.threadId,
        labelIds: message.labelIds || [],
        subject: parsedData.subject,
        toRecipients: parsedData.toRecipients,
        from: parsedData.from,
        ccRecipients: parsedData.ccRecipients,
        bccRecipients: parsedData.bccRecipients,
        snippet: message.snippet,
        headers:
          message.payload?.headers.map((header) => ({
            name: header.name || "",
            value: header.value || "",
          })) || [],
        textData: parsedData.textData,
        htmlData: parsedData.htmlData,
        date: parsedData.date,
        attachments: parsedData.attachments,
      });
    }

    const lastMessageIndex = parsedMessages.length - 1;
    if (lastMessageIndex < 0) {
      continue;
    }
    parsedThreads.push({
      id: thread.id,
      historyId: thread.historyId,
      email: email,
      from: parsedMessages[0].from,
      subject: parsedMessages[0].subject,
      snippet: parsedMessages[lastMessageIndex].snippet,
      date: parsedMessages[lastMessageIndex].date,
      unread: parsedMessages[lastMessageIndex].labelIds.includes("UNREAD"),
      attachments: parsedMessages.flatMap((message) => message.attachments),
      messages: parsedMessages,
    });
  }

  return parsedThreads;
}
