import { OUTLOOK_API_URL, OUTLOOK_EXPAND_THREADLIST } from "../constants";
import {
  OutlookThreadsListDataType,
  // IThreadFilter,
} from "../../model/users.thread";
// import { dLog } from "../../../lib/noProd";

// in endpoints that will not be called often, we can use the async/await syntax
// export const list = async (accessToken: string, filter: IThreadFilter) => {
//   let data: OutlookThreadsListDataType | null = null;
//   let error: string | null = null;

//   try {
//     const res: Response = await fetch(
//       `${OUTLOOK_API_URL}/me/${
//         filter.outlookQuery ? filter.outlookQuery : "messages"
//       }`,
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//       }
//     );

//     if (!res.ok) {
//       error = "Error fetching threads";
//     } else {
//       const resData = await res.json();
//       data = {
//         nextPageToken: resData["@odata.nextLink"],
//         value: resData.value,
//       };
//     }
//   } catch (e) {
//     dLog(e);
//     error = "Error fetching threads";
//   }

//   return { data, error };
// };

// export const listNextPage = async (
//   accessToken: string,
//   nextPageToken: string
// ) => {
//   let data: OutlookThreadsListDataType | null = null;
//   let error: string | null = null;

//   if (!nextPageToken) {
//     error = "Page token not provided";
//     return { data, error };
//   }

//   try {
//     const res: Response = await fetch(
//       `${nextPageToken}`, // Outlook nextPageToken is the entire URL to fetch the next page
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//       }
//     );

//     if (!res.ok) {
//       error = "Error fetching threads";
//     } else {
//       const resData = await res.json();
//       data = {
//         nextPageToken: resData["@odata.nextLink"],
//         value: resData.value,
//       };
//     }
//   } catch (e) {
//     dLog(e);
//     error = "Error fetching threads";
//   }

//   return { data, error };
// };

// in endpoints that will be called often, we use the promise syntax so that the
// calling function can Promise.all() them or handle them in whatever way it wants
export const get = async (accessToken: string, threadId: string) => {
  const response = await fetch(
    `${OUTLOOK_API_URL}/me/messages?$filter=conversationId eq '${threadId}'&${OUTLOOK_EXPAND_THREADLIST}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw Error("Error fetching thread");
  }

  const data: OutlookThreadsListDataType = await response.json();
  return data;
};

export const forward = async (
  accessToken: string,
  messageId: string,
  toRecipients: string[]
) => {
  const response = await fetch(
    `${OUTLOOK_API_URL}/me/messages/${messageId}/forward`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        comment: "--- Forwarded message ---",
        toRecipients: toRecipients.map((email) => {
          return {
            emailAddress: {
              address: email,
            },
          };
        }),
      }),
    }
  );

  // Returns 202 Accepted with no response body if successful
  if (!response.ok) {
    throw Error("Error replying to thread");
  }
};

export const markRead = async (accessToken: string, threadId: string) => {
  const response = await fetch(`${OUTLOOK_API_URL}/me/messages/${threadId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify({ isRead: true }),
  });

  if (!response.ok) {
    throw Error("Error updating thread");
  }

  const data = await response.json();
  return data;
};

export const deleteMessage = async (accessToken: string, messageId: string) => {
  const response = await fetch(`${OUTLOOK_API_URL}/me/messages/${messageId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: "DELETE",
  });

  if (!response.ok) {
    throw Error("Error deleting message");
  }
};

export const moveMessage = async (
  accessToken: string,
  messageId: string,
  destinationFolder: string
) => {
  const response = await fetch(
    `${OUTLOOK_API_URL}/me/messages/${messageId}/move`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ destinationId: destinationFolder }),
    }
  );

  if (!response.ok) {
    throw Error("Error moving message to trash");
  }
};

export const starMessage = async (
  accessToken: string,
  messageId: string,
  isStarred: boolean
) => {
  const response = await fetch(`${OUTLOOK_API_URL}/me/messages/${messageId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "PATCH",
    body: JSON.stringify({
      flag: {
        flagStatus: isStarred ? "flagged" : "notFlagged",
      },
    }),
  });

  if (!response.ok) {
    throw Error("Error starring message");
  }
};
