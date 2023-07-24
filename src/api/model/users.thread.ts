export interface ThreadsListDataType {
  nextPageToken: string;
  resultSizeEstimate: number;
  threads: {
    id: string;
    snippet: string;
    historyId: string;
  }[];
}

export interface ThreadsGetDataType {
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