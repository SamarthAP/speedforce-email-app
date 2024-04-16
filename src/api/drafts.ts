import { IDraft } from "../lib/db";
import { getJWTHeaders } from "./authHeader";
import { SPEEDFORCE_API_URL } from "./constants";
import { DraftReplyType, DraftStatusType } from "./model/users.draft";

export const createDraft = async (
  email: string,
  provider: "google" | "outlook",
  draftId: string, // Generate locally for instant feedback
  to: string,
  cc: string,
  bcc: string,
  subject: string,
  html: string,
  threadId: string | null,
  replyType: DraftReplyType,
  inReplyTo: string | null
) => {
  const authHeader = await getJWTHeaders();

  const response = await fetch(`${SPEEDFORCE_API_URL}/drafts`, {
    method: "POST",
    headers: {
      ...authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      provider,
      draft: {
        id: draftId,
        to,
        cc,
        bcc,
        subject,
        html,
        threadId,
        replyType,
        inReplyTo,
      },
    }),
  });

  if (!response.ok) {
    return { data: null, error: "Error creating draft" };
  }

  return { data: null, error: null };
};

export const listDrafts = async (
  email: string,
  provider: "google" | "outlook"
) => {
  let data: IDraft[] | null = null;

  const authHeader = await getJWTHeaders();

  const response = await fetch(
    `${SPEEDFORCE_API_URL}/drafts/list?email=${email}&provider=${provider}`,
    {
      headers: {
        ...authHeader,
      },
    }
  );

  if (!response.ok) {
    return { data: null, error: "Error fetching drafts" };
  }

  data = (await response.json()).map((draft: any) => ({
    ...draft,
    date: new Date(draft.modifiedAt).getTime(),
  })) as IDraft[];

  return { data, error: null };
};

export const updateDraft = async (
  email: string,
  provider: "google" | "outlook",
  draftId: string,
  to: string,
  cc: string,
  bcc: string,
  subject: string,
  html: string
) => {
  const authHeader = await getJWTHeaders();

  const response = await fetch(`${SPEEDFORCE_API_URL}/drafts`, {
    method: "PUT",
    headers: {
      ...authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      provider,
      draft: {
        id: draftId,
        to,
        cc,
        bcc,
        subject,
        html,
      },
    }),
  });

  if (!response.ok) {
    return { data: null, error: "Error updating draft" };
  }

  return { data: null, error: null };
};

export const updateDraftStatus = async (
  email: string,
  draftId: string,
  status: DraftStatusType
) => {
  const authHeader = await getJWTHeaders();

  const response = await fetch(`${SPEEDFORCE_API_URL}/drafts/status`, {
    method: "PUT",
    headers: {
      ...authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      draft: {
        id: draftId,
        status,
      },
    }),
  });

  if (!response.ok) {
    return { data: null, error: "Error updating draft status" };
  }

  return { data: null, error: null };
};
