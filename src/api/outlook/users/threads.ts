import { OUTLOOK_API_URL } from "../constants";
import { ThreadsListDataType, ThreadsGetDataType } from "../../model/users.thread";

// in endpoints that will not be called often, we can use the async/await syntax
export const list = async (accessToken: string) => {
  let data;
  let error: string | null = null;

  data = {
    nextPageToken: "nextPageToken",
    resultSizeEstimate: 1,
    threads: [{
      id: "id",
      snippet: "snippet",
      historyId: "history id"
    }]
  }

  try {
    const res: Response = await fetch(
      `${OUTLOOK_API_URL}/mailfolders/inbox/messages?$top=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching threads";
    } else {
      data = await res.json()
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
  let data;
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
// export const get = async (accessToken: string, threadId: string) => {
  // const response = await fetch(
  //   `${OUTLOOK_API_URL}/threads/${threadId}?format=metadata`,
  //   {
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //   }
  // );

  // if (!response.ok) {
  //   throw Error("Error fetching thread");
  // }

  // const data: ThreadsGetDataType = await response.json();

  // return data;
// };
