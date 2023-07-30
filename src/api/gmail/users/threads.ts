import { GMAIL_API_URL } from "../constants";
import {
  ThreadsListDataType,
  ThreadsGetDataType,
  ThreadsModifyDataType,
} from "../../model/users.thread";

// in endpoints that will not be called often, we can use the async/await syntax
export const list = async (accessToken: string) => {
  let data: ThreadsListDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${GMAIL_API_URL}/threads?maxResults=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching threads";
    } else {
      data = await res.json();
    }
  } catch (e) {
    console.log(e);
    error = "Error fetching threads";
  }

  return { data, error };
};

export const listNextPage = async (
  accessToken: string,
  nextPageToken: string
) => {
  let data: ThreadsListDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${GMAIL_API_URL}/threads?maxResults=20&pageToken=${nextPageToken}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching threads";
    } else {
      data = await res.json();
    }
  } catch (e) {
    console.log(e);
    error = "Error fetching threads";
  }

  return { data, error };
};

// in endpoints that will be called often, we use the promise syntax so that the
// calling function can Promise.all() them or handle them in whatever way it wants
export const get = async (accessToken: string, threadId: string) => {
  const response = await fetch(
    `${GMAIL_API_URL}/threads/${threadId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw Error("Error fetching thread");
  }

  const data: ThreadsGetDataType = await response.json();

  return data;
};

export const removeLabelIds = async (
  accessToken: string,
  threadId: string,
  labelIds: string[]
) => {
  let data: ThreadsModifyDataType | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(
      `${GMAIL_API_URL}/threads/${threadId}/modify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          removeLabelIds: labelIds,
        }),
      }
    );

    if (!response.ok) {
      error = "Error removing labels";
    } else {
      data = await response.json();
    }
  } catch (e) {
    console.log(e);
    error = "Error removing labels";
  }

  return { data, error };
};
