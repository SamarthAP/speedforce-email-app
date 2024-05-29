import { gmail_v1 } from "../types/gmail";

const GMAIL_API_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

// // Note: must have query param. we don't have an "all mail" folder. queryParam is a string like "labelIds=STARRED"
export const listThreads = async (
  accessToken: string,
  gmailQueryParam: string,
  pageToken?: string
) => {
  // TODO: check if query param or just regular param for each page lol
  let url = `${GMAIL_API_URL}/threads?maxResults=20&${gmailQueryParam}`;

  if (gmailQueryParam && pageToken) {
    url += `&pageToken=${pageToken}`;
  } else if (pageToken) {
    // if there's no query param, then there is already a & in the url
    url += `pageToken=${pageToken}`;
  }

  const res: Response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw Error("Error fetching gmail threads");
  }

  return res.json() as Promise<gmail_v1.Schema$ListThreadsResponse>;
};

export const getThread = async (accessToken: string, threadId: string) => {
  const url = `${GMAIL_API_URL}/threads/${threadId}`;

  const res: Response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw Error("Error fetching gmail thread");
  }

  return res.json() as Promise<gmail_v1.Schema$Thread>;
};

export const listDrafts = async (accessToken: string, pageToken?: string) => {
  let url = `${GMAIL_API_URL}/drafts?maxResults=20`;

  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  const res: Response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw Error("Error fetching gmail drafts");
  }

  return res.json() as Promise<gmail_v1.Schema$ListDraftsResponse>;
};
