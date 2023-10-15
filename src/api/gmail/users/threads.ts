import { GMAIL_API_URL, GMAIL_FOLDER_IDS_MAP } from "../constants";
import { ID_DONE, ID_SPAM, ID_TRASH } from "../../constants";
import {
  GoogleThreadsListDataType,
  GoogleThreadsGetDataType,
  GoogleThreadsModifyDataType,
  IThreadFilter,
} from "../../model/users.thread";
import { dLog } from "../../../lib/noProd";
import { getRFC2822DateString } from "../helpers";
import { unescape } from "lodash";

// in endpoints that will not be called often, we can use the async/await syntax
export const list = async (accessToken: string, filter: IThreadFilter) => {
  let data: GoogleThreadsListDataType | null = null;
  let error: string | null = null;

  try {
    let folderQuery = "";
    const inboxName = GMAIL_FOLDER_IDS_MAP.getValue(filter.folderId);
    if (filter && filter.folderId && inboxName) {
      if (filter.folderId !== ID_DONE) {
        folderQuery = `&labelIds=${inboxName}`;
      }

      if ([ID_SPAM, ID_TRASH].includes(filter.folderId)) {
        folderQuery += `&includeSpamTrash=true`;
      }
    }

    // &q=from:hello@digest.producthunt.com for testing
    const res: Response = await fetch(
      `${GMAIL_API_URL}/threads?maxResults=20${folderQuery}`,
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
  if (filter?.folderId !== ID_DONE) {
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

export const sendEmail = async (
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  messageContent: string
) => {
  let data: any | null = null; // TODO: define type
  let error: string | null = null;

  try {
    const encodedReply = btoa(
      'Content-Type: text/html; charset="UTF-8"\n' +
        "MIME-Version: 1.0\n" +
        "Content-Transfer-Encoding: 7bit\n" +
        `Subject: ${subject}\n` +
        `From: ${from}\n` +
        `To: ${to}\n\n` +
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
      }),
    });
    if (!response.ok) {
      error = "Error sending email";
    } else {
      data = await response.json();
    }
  } catch (e) {
    dLog(e);
    error = "Error sending email";
  }

  return { data, error };
};

export const forward = async (
  accessToken: string,
  from: string,
  fromOriginal: string,
  to: string[],
  toOriginal: string,
  subject: string,
  headerMessageId: string,
  threadId: string,
  messageContent: string
) => {
  let data: any | null = null; // TODO: define type
  let error: string | null =   null;

  try {
    // const encodedReply = btoa(
    //   'Content-Type: text/html; charset="UTF-8"\n' +
    //   "MIME-Version: 1.0\n" +
    //   "Content-Transfer-Encoding: 7bit\n" +
    //   `Message-ID: ${headerMessageId}\n` +
    //   `Subject: ${subject}\n` +
    //   `From: ${fromOriginal}\n` +
    //   `To: ${toOriginal}\n` +
    //   `Resent-From: ${from}\n` +
    //   `Resent-To: ${to.join(",")}\n` +
    //   `Resent-Date: ${getRFC2822DateString(new Date())}\n\n` +
    //   messageContent
    // )
    //   .replace(/\+/g, "-")
    //   .replace(/\//g, "_")
    //   .replace(/=+$/, "");

    // const encodedReply = btoa(
    //   'Content-Type: text/html; charset="UTF-8"\n' +
    //   "MIME-Version: 1.0\n" +
    //   "Content-Transfer-Encoding: 7bit\n" +
    //   `Resent-From: colin@payswift.ca\n` +
    //   `Resent-To: colin.d.chung@gmail.com\n` +
    //   `Resent-Date: ${getRFC2822DateString(new Date())}\n` +
    //   `From: Medium Weekly Digest <noreply@medium.com>\n` +
    //   `To: colin@payswift.ca\n` +
    //   `Subject: FW: ${subject}\n` +
    //   `Message-ID: <gFW3sbQSTKu9w_VvMeV28g@geopod-ismtpd-5>\n`
    // )
    //   .replace(/\+/g, "-")
    //   .replace(/\//g, "_")
    //   .replace(/=+$/, "");

    const encodedReply = btoa(
      'Content-Type: text/html; charset="UTF-8"\n' +
      "MIME-Version: 1.0\n" +
      "Content-Transfer-Encoding: 7bit\n" +
      `From: colin@payswift.ca\n` +
      `To: colin.d.chung@gmail.com\n` +
      `Subject: ${subject}\n\n` +
      'This is a test'
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
