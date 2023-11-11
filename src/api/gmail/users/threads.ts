import { GMAIL_API_URL, GMAIL_FOLDER_IDS_MAP } from "../constants";
import { FOLDER_IDS } from "../../constants";
import {
  GoogleThreadsListDataType,
  GoogleThreadsGetDataType,
  GoogleThreadsModifyDataType,
  IThreadFilter,
} from "../../model/users.thread";
import { dLog } from "../../../lib/noProd";

// in endpoints that will not be called often, we can use the async/await syntax
export const list = async (accessToken: string, filter: IThreadFilter) => {
  let data: GoogleThreadsListDataType | null = null;
  let error: string | null = null;

  try {
    // &q=from:hello@digest.producthunt.com for testing
    const res: Response = await fetch(
      `${GMAIL_API_URL}/threads?maxResults=20${filter.gmailQuery}`,
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
    dLog(e);
    error = "Error fetching threads";
  }

  return { data, error };
};

export const listNextPage = async (
  accessToken: string,
  nextPageToken: string,
  filter: IThreadFilter
) => {
  let data: GoogleThreadsListDataType | null = null;
  let error: string | null = null;

  let label = "";
  if (filter?.folderId !== FOLDER_IDS.DONE) {
    label = GMAIL_FOLDER_IDS_MAP.getValue(filter.folderId) || "";
  }

  const fetchURL =
    filter && label
      ? `${GMAIL_API_URL}/threads?maxResults=20&labelIds=${label}&pageToken=${nextPageToken}`
      : `${GMAIL_API_URL}/threads?maxResults=20&pageToken=${nextPageToken}`;

  try {
    const res: Response = await fetch(fetchURL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      error = "Error fetching threads";
    } else {
      data = await res.json();
    }
  } catch (e) {
    dLog(e);
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

  const data: GoogleThreadsGetDataType = await response.json();

  return data;
};

export const removeLabelIds = async (
  accessToken: string,
  threadId: string,
  labelIds: string[]
) => {
  let data: GoogleThreadsModifyDataType | null = null;
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
      error = "Error removing labels " + labelIds.join(", ");
    } else {
      data = await response.json();
    }
  } catch (e) {
    dLog(e);
    error = "Error removing labels " + labelIds.join(", ");
  }

  return { data, error };
};

export const addLabelIds = async (
  accessToken: string,
  threadId: string,
  labelIds: string[]
) => {
  let data: GoogleThreadsModifyDataType | null = null;
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
          addLabelIds: labelIds,
        }),
      }
    );

    if (!response.ok) {
      error = "Error adding labels " + labelIds.join(", ");
    } else {
      data = await response.json();
    }
  } catch (e) {
    dLog(e);
    error = "Error adding labels " + labelIds.join(", ");
  }

  return { data, error };
};

export const sendReply = async (
  accessToken: string,
  from: string,
  to: string[],
  subject: string,
  headerMessageId: string,
  threadId: string,
  messageContent: string
) => {
  let data: any | null = null; // TODO: define type
  let error: string | null = null;

  try {
    const encodedReply = btoa(
      'Content-Type: text/html; charset="UTF-8"\n' +
        "MIME-Version: 1.0\n" +
        "Content-Transfer-Encoding: 7bit\n" +
        `In-Reply-To: ${headerMessageId}\n` +
        `References: ${headerMessageId}\n` +
        `Subject: Re: ${subject}\n` +
        `From: ${from}\n` +
        `To: ${to.join(",")}\n\n` +
        messageContent
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await fetch(`${GMAIL_API_URL}/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        raw: encodedReply,
        threadId,
      }),
    });
    if (!response.ok) {
      error = "Error sending reply";
    } else {
      data = await response.json();
    }
  } catch (e) {
    dLog(e);
    error = "Error sending reply";
  }

  return { data, error };
};

export const modify = async (
  accessToken: string,
  threadId: string,
  addLabelIds: string[],
  removeLabelIds: string[]
) => {
  let data: GoogleThreadsModifyDataType | null = null;
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
          addLabelIds,
          removeLabelIds,
        }),
      }
    );

    if (!response.ok) {
      error = `Error modifying thread. Attempted to add ${addLabelIds} and remove ${removeLabelIds}`;
    } else {
      data = await response.json();
    }
  } catch (e) {
    dLog(e);
    error = `Error modifying thread. Attempted to add ${addLabelIds} and remove ${removeLabelIds}`;
  }

  return { data, error };
};

export const deleteThread = async (accessToken: string, threadId: string) => {
  // Request body
  // The request body must be empty.

  // Response body
  // If successful, the response body is empty.

  let data: any | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(`${GMAIL_API_URL}/threads/${threadId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      error = "Error deleting thread";
    } else {
      data = "ok";
    }
  } catch (e) {
    dLog(e);
    error = "Error deleting thread";
  }

  return { data, error };
};

export const trashThread = async (accessToken: string, threadId: string) => {
  let data: GoogleThreadsModifyDataType | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(`${GMAIL_API_URL}/threads/${threadId}/trash`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      error = "Error trashing thread gmail";
    } else {
      data = await response.json();
    }
  } catch (e) {
    dLog(e);
    error = "Error trashing thread gmail";
  }

  return { data, error };
};
