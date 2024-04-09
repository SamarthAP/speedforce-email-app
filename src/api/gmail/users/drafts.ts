import { Base64 } from "js-base64";
import {
  GoogleDraftType,
  GoogleDraftsGetDataType,
  GoogleDraftsListDataType,
} from "../../model/users.draft";
import { GMAIL_API_URL } from "../constants";

export const create = async (
  accessToken: string,
  from: string,
  to: string,
  cc: string | null,
  bcc: string | null,
  subject: string,
  messageContent: string
) => {
  let data: GoogleDraftType | null = null;
  let error: string | null = null;

  const encodedDraft = Base64.encode(
    'Content-Type: text/html; charset="UTF-8"\n' +
      "MIME-Version: 1.0\n" +
      "Content-Transfer-Encoding: 7bit\n" +
      `Subject: =?UTF-8?B?${Base64.encode(subject)}?=\n` +
      `From: ${from}\n` +
      (to ? `To: ${to}\n` : "") + // To is technically an optional field if CC is provided
      (cc ? `Cc: ${cc}\n` : "") +
      (bcc ? `Bcc: ${bcc}\n` : "") +
      "\n" +
      messageContent
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    const res = await fetch(`${GMAIL_API_URL}/drafts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          raw: encodedDraft,
        },
      }),
    });

    if (!res.ok) {
      error = "Error sending email";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error fetching history";
  }

  return { data, error };
};

export const createForReply = async (
  accessToken: string,
  from: string,
  to: string,
  cc: string | null,
  bcc: string | null,
  subject: string,
  messageContent: string,
  headerMessageId: string,
  threadId: string
) => {
  let data: GoogleDraftType | null = null;
  let error: string | null = null;

  const encodedDraft = Base64.encode(
    'Content-Type: text/html; charset="UTF-8"\n' +
      "MIME-Version: 1.0\n" +
      "Content-Transfer-Encoding: 7bit\n" +
      `Subject: =?UTF-8?B?${Base64.encode(subject)}?=\n` +
      `From: ${from}\n` +
      (to ? `To: ${to}\n` : "") + // To is technically an optional field if CC is provided
      (cc ? `Cc: ${cc}\n` : "") +
      (bcc ? `Bcc: ${bcc}\n` : "") +
      (headerMessageId
        ? `In-Reply-To: ${headerMessageId}\n` +
          `References: ${headerMessageId}\n`
        : "") +
      "\n" +
      messageContent
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    const res = await fetch(`${GMAIL_API_URL}/drafts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          raw: encodedDraft,
          threadId,
        },
      }),
    });

    if (!res.ok) {
      error = "Error sending email";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error fetching history";
  }

  return { data, error };
};

export const list = async (accessToken: string) => {
  let data: GoogleDraftsListDataType | null = null;
  let error: string | null = null;

  const res: Response = await fetch(`${GMAIL_API_URL}/drafts?maxResults=20`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    error = "Error fetching drafts";
    return { data, error };
  }

  data = (await res.json()) as GoogleDraftsListDataType;
  return { data, error };
};

export const get = async (accessToken: string, draftId: string) => {
  const res = await fetch(`${GMAIL_API_URL}/drafts/${draftId}?format=full`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw Error("Error fetching draft");
  }

  const data: GoogleDraftsGetDataType = await res.json();
  return data;
};

export const update = async (
  accessToken: string,
  draftId: string,
  from: string,
  to: string,
  cc: string | null,
  bcc: string | null,
  subject: string,
  messageContent: string,
  replyTo: string | null = null
) => {
  let data: GoogleDraftType | null = null;
  let error: string | null = null;

  const encodedDraft = Base64.encode(
    'Content-Type: text/html; charset="UTF-8"\n' +
      "MIME-Version: 1.0\n" +
      "Content-Transfer-Encoding: 7bit\n" +
      `Subject: =?UTF-8?B?${Base64.encode(subject)}?=\n` +
      `From: ${from}\n` +
      (to ? `To: ${to}\n` : "") + // To is technically an optional field if CC is provided
      (cc ? `Cc: ${cc}\n` : "") +
      (bcc ? `Bcc: ${bcc}\n` : "") +
      (replyTo ? `In-Reply-To: ${replyTo}\n` : "") +
      "\n" +
      messageContent
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    const res = await fetch(`${GMAIL_API_URL}/drafts/${draftId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        id: draftId,
        message: {
          raw: encodedDraft,
        },
      }),
    });

    if (!res.ok) {
      error = "Error updating draft";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error updating draft";
  }

  return { data, error };
};

export const deleteDraft = async (accessToken: string, draftId: string) => {
  let error: string | null = null;
  try {
    const res = await fetch(`${GMAIL_API_URL}/drafts/${draftId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      error = "Error deleting draft";
    }
  } catch (e) {
    error = "Error deleting draft";
  }

  return { data: null, error };
};
