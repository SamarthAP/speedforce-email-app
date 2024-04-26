import { IDraft } from "../lib/db";
import { getJWTHeaders } from "./authHeader";
import { SPEEDFORCE_API_URL } from "./constants";
import {
  DraftParticipantType,
  DraftReplyType,
  DraftStatusType,
} from "./model/users.draft";

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

export const updateDraftParticipants = async (
  email: string,
  draftId: string,
  participants: DraftParticipantType[]
) => {
  try {
    const authHeader = await getJWTHeaders();
    const res = await fetch(`${SPEEDFORCE_API_URL}/drafts/participants`, {
      method: "PUT",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        draftId,
        participants,
      }),
    });

    if (!res.ok) {
      return { data: null, error: "Error sharing draft" };
    } else {
      return { data: null, error: null };
    }
  } catch (e) {
    return { data: null, error: "Error sharing draft" };
  }
};

export const loadParticipantsForDraft = async (
  draftId: string,
  email: string
) => {
  const authHeader = await getJWTHeaders();
  const res = await fetch(
    `${SPEEDFORCE_API_URL}/drafts/participants?draftId=${draftId}&email=${email}`,
    {
      method: "GET",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    return { data: null, error: "Error loading participants for draft" };
  }

  const data = await res.json();
  return {
    data: data.map((participant: any) => ({
      email: participant.email,
      accessType: participant.access_level,
    })),
    error: null,
  };
};

export const listSharedDrafts = async (email: string) => {
  try {
    const authHeader = await getJWTHeaders();
    const res: Response = await fetch(
      `${SPEEDFORCE_API_URL}/drafts/listForUser?email=${email}`,
      {
        method: "GET",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      return { data: null, error: "Error loading shared drafts" };
    } else {
      const data = await res.json();
      return {
        data: data.map((thread: any) => ({
          id: thread.draft_id,
          from: thread.draft.email,
          subject: thread.draft.subject,
          to: thread.draft.to,
          cc: thread.draft.cc,
          bcc: thread.draft.bcc,
          date: thread.draft.date,
          html: thread.draft.html,
        })),
        error: null,
      };
    }
  } catch (e) {
    return { data: null, error: "Error loading shared drafts" };
  }
};

export const getSharedDraft = async (draftId: string, email: string) => {
  const authHeader = await getJWTHeaders();
  const res = await fetch(
    `${SPEEDFORCE_API_URL}/drafts?draftId=${draftId}&email=${email}`,
    {
      method: "GET",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    return { data: null, error: "Error loading draft" };
  } else {
    return { data: await res.json(), error: null };
  }
};

export const addCommentToDraft = async (
  draftId: string,
  email: string,
  comment: string
) => {
  const authHeader = await getJWTHeaders();
  const res = await fetch(`${SPEEDFORCE_API_URL}/drafts/comment`, {
    method: "POST",
    headers: {
      ...authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      draftId,
      email,
      comment,
    }),
  });

  if (!res.ok) {
    return { data: null, error: "Error adding comment" };
  } else {
    return { data: null, error: null };
  }
};

export const listCommentsForDraft = async (draftId: string) => {
  const authHeader = await getJWTHeaders();
  const res = await fetch(
    `${SPEEDFORCE_API_URL}/drafts/comments?draftId=${draftId}`,
    {
      method: "GET",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    return { data: null, error: "Error loading comments" };
  }

  const data = await res.json();
  return {
    data,
    error: null,
  };
};
