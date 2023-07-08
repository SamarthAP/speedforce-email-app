import { getAccessToken } from "../../../api/accessToken";
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

export const list = async (email: string) => {
  const accessToken = await getAccessToken(email);

  let data: ThreadsListDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${GMAIL_API_URL}/threads?maxResults=10`,
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
export const get = async (email: string, threadId: string) => {
  const accessToken = await getAccessToken(email);

  let data: ThreadsGetDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${GMAIL_API_URL}/threads/${threadId}?format=metadata`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching thread";
    } else {
      data = await res.json();
    }
  } catch (e) {
    console.log(e);
    error = "Error fetching thread";
  }

  return { data, error };
};

interface ThreadsGetFullListDataType {
  threads: ThreadsGetDataType[];
  nextPageToken: string;
  historyId: number;
}
export const getFullList = async (email: string) => {
  let data: ThreadsGetFullListDataType = {
    threads: [],
    nextPageToken: "",
    historyId: 0,
  };
  let error: string | null = null;

  const listRes = await list(email);

  if (listRes.error || !listRes.data) {
    error = "Error fetching threads";
    return { data, error };
  }

  data.nextPageToken = listRes.data.nextPageToken; // TODO: handle saving to db
  let maxHistoryId = 0;

  for (let i = 0; i < listRes.data.threads.length; i++) {
    const thread = listRes.data.threads[i];
    const threadRes = await get(email, thread.id);

    if (threadRes.error || !threadRes.data) {
      console.log("Error fetching thread", thread.id);
    } else {
      if (parseInt(threadRes.data.historyId) > maxHistoryId) {
        maxHistoryId = parseInt(threadRes.data.historyId);
      }
      data.threads.push(threadRes.data);
    }
  }

  data.historyId = maxHistoryId; // TODO: handle saving to db

  return { data, error };
};

// example response:
// {
//   "threads": [
//     {
//       "id": "1899293a220",
//       "snippet": "If you were using Twitter over the weekend, you probably came across the error “Rate limit exceeded.” Turns out Twitter... Product Hunt Read in browser This newsletter is brought to you by PLEASE, JUST",
//       "historyId": "15409"
//     },
//     {
//       "id": "1890cb865",
//       "snippet": "Remember the whole Elon vs Zuck fight? Well, it&#39;s apparently still going ahead, and Musk thinks there could be a... Product Hunt Read in browser This newsletter is brought to you by GLADIATORS ARE",
//       "historyId": "15149"
//     },
//     {
//       "id": "189078f98d99d",
//       "snippet": "Welcome to Thursday. Remember Google&#39;s cheeky ad from yesterday? Well, looks like Pixel&#39;s marketing team poked too soon: People are... Product Hunt Read in browser This newsletter is brought to",
//       "historyId": "14903"
//     },
//     {
//       "id": "189fd9a4",
//       "snippet": "Good morning makers, hunters, and everybody in between. Google&#39;s latest Pixel ad throws some major shade at the iPhone, the... Product Hunt Read in browser This newsletter is brought to you by",
//       "historyId": "14719"
//     },
//     {
//       "id": "188fe8dc24e",
//       "snippet": "This week, AI is ready to rescue us from: travel stress, boring QR codes, factual mistakes, text-only journaling, and customer queries. Read in browser DEEPER LEARNING A weekly AI newsletter, brought",
//       "historyId": "14478"
//     },
//     {
//       "id": "188fdcf441",
//       "snippet": "The unicorn social app IRL is shutting down after an internal investigation by their board of directors found that 95%... Product Hunt Read in browser This newsletter is brought to you by FAKE IT &#39;",
//       "historyId": "14477"
//     },
//     {
//       "id": "188f805dbf",
//       "snippet": "Remember SVB? The startup bank that infamously collapsed earlier this year sending a wave of anxiety and stress to startup... Product Hunt Read in browser SVB THE MUSICIAL Remember SVB? The startup",
//       "historyId": "14476"
//     },
//     {
//       "id": "188e8952c07b",
//       "snippet": "Remember Napster? The music-sharing app from the early 00s that&#39;s now a streaming service. Well, a different kind of Napster just... Product Hunt Read in browser A NEW KIND OF NAPSTER Remember",
//       "historyId": "14475"
//     },
//     {
//       "id": "188e4b055",
//       "snippet": "Yes, you read that right. Elon Musk has challenged Mark Zuckerberg to the fight of the decade, and Zuck accepted. Who... Product Hunt Read in browser CEO CAGE MATCH Yes, you read that right. Elon Musk",
//       "historyId": "14474"
//     },
//     {
//       "id": "188de6d1f5",
//       "snippet": "What&#39;s one product you&#39;ve discovered this year that you love? Share your secrets Product Hunt Read in browser NO GATEKEEPING What&#39;s one product you&#39;ve discovered this year that you love",
//       "historyId": "14473"
//     }
//   ],
//   "nextPageToken": "06039578834715",
//   "resultSizeEstimate": 201
// }
