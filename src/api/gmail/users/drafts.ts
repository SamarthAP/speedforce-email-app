import { Base64 } from "js-base64";
import { GmailDraftDataType } from "../../model/users.draft";
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
  let data: GmailDraftDataType | null = null;
  let error: string | null = null;

  const encodedDraft = Base64.encode(
    'Content-Type: text/html; charset="UTF-8"\n' +
      "MIME-Version: 1.0\n" +
      "Content-Transfer-Encoding: 7bit\n" +
      `Subject: =?UTF-8?B?${Base64.encode(subject)}?=\n` +
      `From: ${from}\n` +
      // `To: ${to}\n\n` +
      (to ? `To: ${to}\n` : "") +
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
      console.log(data);
    }
  } catch (e) {
    error = "Error fetching history";
  }

  return { data, error };
};

export const update = async (
  accessToken: string,
  draftId: string,
  from: string,
  to: string,
  cc: string | null,
  bcc: string | null,
  subject: string,
  messageContent: string
) => {
  let data: GmailDraftDataType | null = null;
  let error: string | null = null;

  const encodedDraft = Base64.encode(
    'Content-Type: text/html; charset="UTF-8"\n' +
      "MIME-Version: 1.0\n" +
      "Content-Transfer-Encoding: 7bit\n" +
      `Subject: =?UTF-8?B?${Base64.encode(subject)}?=\n` +
      `From: ${from}\n` +
      // `To: ${to}\n\n` +
      (to ? `To: ${to}\n` : "") +
      (cc ? `Cc: ${cc}\n` : "") +
      (bcc ? `Bcc: ${bcc}\n` : "") +
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
        message: {
          raw: encodedDraft,
        },
      }),
    });

    if (!res.ok) {
      error = "Error updating draft";
    } else {
      data = await res.json();
      console.log(data);
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
