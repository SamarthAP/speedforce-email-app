import { getJWTHeaders } from "./authHeader";
import { SPEEDFORCE_API_URL } from "./constants";
import {
  SharedDraftDataType,
  SharedDraftParticipantType,
  SharedDraftStatusType,
} from "./model/users.shared.draft";

export const saveSharedDraft = async (
  email: string,
  draftData: SharedDraftDataType
) => {
  try {
    const authHeader = await getJWTHeaders();
    const res = await fetch(`${SPEEDFORCE_API_URL}/drafts`, {
      method: "POST",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        draftData,
      }),
    });

    if (!res.ok) {
      return { data: null, error: "Error saving draft" };
    } else {
      return { data: null, error: null };
    }
  } catch (e) {
    return { data: null, error: "Error saving draft" };
  }
};

export const updateSharedDraftStatus = async (
  threadId: string,
  email: string,
  status: SharedDraftStatusType
) => {
  const authHeader = await getJWTHeaders();
  const res = await fetch(`${SPEEDFORCE_API_URL}/drafts/status`, {
    method: "POST",
    headers: {
      ...authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      threadId,
      email,
      status,
    }),
  });

  if (!res.ok) {
    return { data: null, error: "Error updating draft status" };
  } else {
    return { data: null, error: null };
  }
};

export const shareDraft = async (
  email: string,
  draftData: SharedDraftDataType,
  participants: SharedDraftParticipantType[]
) => {
  try {
    const authHeader = await getJWTHeaders();
    const res = await fetch(`${SPEEDFORCE_API_URL}/drafts/participants`, {
      method: "POST",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        draftData,
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

export const listSharedDrafts = async (email: string) => {
  try {
    const authHeader = await getJWTHeaders();
    const res: Response = await fetch(
      `${SPEEDFORCE_API_URL}/drafts/listSharedDraftsForUser?email=${email}`,
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
          threadId: thread.draft.owner_thread_id,
          from: thread.draft.owner_email,
          subject: thread.draft.subject,
          to: thread.draft.recipients,
          cc: thread.draft.cc,
          bcc: thread.draft.bcc,
          snippet: thread.draft.snippet,
          date: thread.draft.date,
          html: thread.draft.html_data,
        })),
        error: null,
      };
    }
  } catch (e) {
    return { data: null, error: "Error loading shared drafts" };
  }
};

export const loadParticipantsForDraft = async (
  draftId: string,
  email: string
) => {
  const authHeader = await getJWTHeaders();
  const res = await fetch(
    `${SPEEDFORCE_API_URL}/drafts/listParticipantsForDraft?draftId=${draftId}&email=${email}`,
    {
      method: "GET",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    return { data: null, error: "Error loading editor" };
  }

  const data = await res.json();
  return {
    data: data.map((participant: any) => ({
      email: participant.email,
      accessType: participant.accessLevel, // FIX THIS
    })),
    error: null,
  };
};

export const addCommentToDraft = async (
  threadId: string,
  email: string,
  content: string
) => {
  const authHeader = await getJWTHeaders();
  const res = await fetch(`${SPEEDFORCE_API_URL}/drafts/comment`, {
    method: "POST",
    headers: {
      ...authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      threadId,
      email,
      content,
    }),
  });

  if (!res.ok) {
    return { data: null, error: "Error adding comment" };
  } else {
    return { data: null, error: null };
  }
};

export const listCommentsForDraft = async (threadId: string) => {
  const authHeader = await getJWTHeaders();
  const res = await fetch(
    `${SPEEDFORCE_API_URL}/drafts/comment?threadId=${threadId}`,
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
    data: data.map((c: any) => ({
      id: c.id,
      email: c.commentor?.email,
      date: c.date,
      comment: c.content,
    })),
    error: null,
  };
};