export interface EmailMessage {
  id: string;
  historyId: string;
  threadId: string;
  labelIds: string[];
  subject: string;
  toRecipients: string[];
  from: string;
  ccRecipients: string[];
  bccRecipients: string[];
  snippet: string;
  headers: {
    name: string;
    value: string;
  }[];
  textData: string;
  htmlData: string;
  date: number;
  attachments: ParsedAttachment[];
}

export interface EmailThread {
  id: string;
  historyId: string;
  email: string;
  from: string;
  subject: string;
  snippet: string;
  date: number;
  unread: boolean;
  // labelIds: string[];
  attachments: ParsedAttachment[];
  messages: EmailMessage[];
}
