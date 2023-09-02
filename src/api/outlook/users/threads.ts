import { OUTLOOK_API_URL, getInboxName } from "../constants";
import { OutlookThreadsListDataType, IThreadFilter } from "../../model/users.thread";

// in endpoints that will not be called often, we can use the async/await syntax
export const list = async (accessToken: string, filter: IThreadFilter | null = null) => {
  let data: OutlookThreadsListDataType | null = null;
  let error: string | null = null;

  try {
    let folderId = "";
    if(filter && filter.folderId) {
      folderId = `mailfolders/${getInboxName(filter.folderId)}`;
    }

    const res: Response = await fetch(
      `${OUTLOOK_API_URL}/${folderId}/messages?$select=id,conversationId&$top=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching threads";
    } else {
      let resData = await res.json();
      data = {
        nextPageToken: resData["@odata.nextLink"],
        value: resData.value
      }
    }
  } catch (e) {
    console.log(e);
    error = "Error fetching threads";
  }

  return { data, error };
}

export const listNextPage = async (
  accessToken: string,
  nextPageToken: string
) => {
  let data: OutlookThreadsListDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${nextPageToken}`, // Outlook nextPageToken is the entire URL to fetch the next page
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
    `${OUTLOOK_API_URL}/messages?$select=id,subject,bodyPreview,body,sender,toRecipients,from,receivedDateTime,isRead,conversationId&$filter=conversationId eq '${threadId}'`,
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

export const markRead = async (accessToken: string, threadId: string) => {
  const response = await fetch(
    `${OUTLOOK_API_URL}/messages/${threadId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      method: "PATCH",
      body: JSON.stringify({ isRead: true })
    }
  );

  if (!response.ok) {
    throw Error("Error updating thread");
  }

  const data = await response.json();
  return data;
}
