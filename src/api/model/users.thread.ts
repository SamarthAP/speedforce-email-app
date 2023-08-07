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
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: {
      partId: string;
      mimeType: string;
      filename: string;
      headers: {
        name: string;
        value: string;
      }[];
      parts?: {
        partId: string;
        mimeType: string; // use this mimetype to determine if it's text or html or attachment
        filename: string;
        headers: {
          name: string;
          value: string;
        }[];
        body: {
          size: number;
          data?: string; // only for messages with only text or html
          attachmentId?: string; // only for attachments
        };
        parts?: {
          // you will get this nested part when there is text/html and attachments, and this specific nested part is only for the text/html
          partId: string;
          mimeType: string;
          filename: string;
          headers: {
            name: string;
            value: string;
          }[];
          body: {
            size: number;
            data?: string; // only for mimeType:text or mimeType:html
          };
        }[];
      }[];
      body: {
        size: number;
        data?: string; // only for messages with only text or html
      };
    };
    sizeEstimate: number;
    historyId: string;
    internalDate: string;
  }[];
}

export interface ThreadsModifyDataType {
  id: string;
  messages: {
    id: string;
    threadId: string;
    labelIds: string[];
  }[];
}
