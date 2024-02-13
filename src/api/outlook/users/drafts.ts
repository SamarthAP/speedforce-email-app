import { OutlookDraftDataType } from "../../model/users.draft";
// import { NewAttachment } from "../../model/users.attachment";
import { OUTLOOK_API_URL } from "../constants";

export const create = async (
  accessToken: string,
  toRecipients: string[],
  ccRecipients: string[],
  bccRecipients: string[],
  subject: string,
  content: string
  // attachments: NewAttachment[]
) => {
  const body: OutlookDraftDataType = {};
  let data: OutlookDraftDataType | null = null;

  if (toRecipients.length > 0) {
    body.toRecipients = toRecipients.map((email) => ({
      emailAddress: { address: email },
    }));
  }
  if (ccRecipients.length > 0) {
    body.ccRecipients = ccRecipients.map((email) => ({
      emailAddress: { address: email },
    }));
  }
  if (bccRecipients.length > 0) {
    body.bccRecipients = bccRecipients.map((email) => ({
      emailAddress: { address: email },
    }));
  }

  if (subject) {
    body.subject = subject;
  }
  if (content) {
    body.body = { contentType: "HTML", content };
  }
  // if (attachments.length > 0) {
  //   body.attachments = attachments.map((attachment) => ({
  //     name: attachment.filename,
  //     contentBytes: attachment.data,
  //     contentType: attachment.mimeType,
  //     size: attachment.size,
  //   }));
  // }

  const response = await fetch(`${OUTLOOK_API_URL}/me/messages`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw Error("Error creating draft");
  } else {
    data = await response.json();
  }

  return data;
};

export const update = async (
  accessToken: string,
  messageId: string,
  toRecipients: string[],
  ccRecipients: string[],
  bccRecipients: string[],
  subject: string,
  content: string
  // attachments: NewAttachment[]
) => {
  const body: OutlookDraftDataType = {};
  if (toRecipients.length > 0) {
    body.toRecipients = toRecipients.map((email) => ({
      emailAddress: { address: email },
    }));
  }
  if (ccRecipients.length > 0) {
    body.ccRecipients = ccRecipients.map((email) => ({
      emailAddress: { address: email },
    }));
  }
  if (bccRecipients.length > 0) {
    body.bccRecipients = bccRecipients.map((email) => ({
      emailAddress: { address: email },
    }));
  }

  if (subject) {
    body.subject = subject;
  }
  if (content) {
    body.body = { contentType: "HTML", content };
  }
  // if (attachments.length > 0) {
  //   body.attachments = attachments.map((attachment) => ({
  //     name: attachment.filename,
  //     contentBytes: attachment.data,
  //     contentType: attachment.mimeType,
  //     size: attachment.size,
  //   }));
  // }

  const response = await fetch(`${OUTLOOK_API_URL}/me/messages/${messageId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw Error("Error updating draft");
  }

  const data = await response.json();
  return data;
};

export const send = async (accessToken: string, messageId: string) => {
  const response = await fetch(
    `${OUTLOOK_API_URL}/me/messages/${messageId}/send`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    throw Error("Error sending draft");
  }
};
