export interface HistoryListDataType {
  history: {
    id: string;
    messages: {
      id: string;
      threadId: string;
    }[];
    messagesAdded?: {
      message: {
        id: string;
        threadId: string;
        labelIds: string[];
      };
    }[];
    // TODO: messagesDeleted and other fields can go here in future
  }[];
  historyId: string;
}
