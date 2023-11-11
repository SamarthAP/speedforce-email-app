export interface NotificationMessageType {
  messageType: "GMAIL_NOTIFICATION" | "OUTLOOK_NOTIFICATION";
  messageData: {
    email: string;
    provider: string;
    historyId: string;
  };
}

export interface WatchResponseType {
  historyId: string;
  expiration: string;
}
