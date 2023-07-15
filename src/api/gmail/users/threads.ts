import { GMAIL_API_URL } from "../constants";

interface ThreadsListDataType {
  nextPageToken: string;
  resultSizeEstimate: number;
  threads: {
    id: string;
    snippet: string;
    historyId: string;
  }[];
}
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

interface ThreadsGetDataType {
  historyId: string;
  id: string;
  messages: {
    historyId: string;
    id: string;
    internalDate: string;
    labelIds: string[];
    sizeEstimate: number;
    snippet: string;
    threadId: string;
    payload: {
      headers: {
        name: string;
        value: string;
      }[];
      mimeType: string;
    };
  }[];
}

// in endpoints that will be called often, we use the promise syntax so that the
// calling function can Promise.all() them or handle them in whatever way it wants
export const get = async (accessToken: string, threadId: string) => {
  const response = await fetch(
    `${GMAIL_API_URL}/threads/${threadId}?format=metadata`,
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
