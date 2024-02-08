// import { OutlookAttachmentDataType } from "./users.attachment";
import { OutlookEmailAddress } from "./users.message";

export interface GmailDraftDataType {
  id?: string;
  message?: {
    id?: string;
    threadId?: string;
  };
}

export interface OutlookDraftDataType {
  id?: string;
  subject?: string;
  conversationId?: string;
  createdDateTime?: string;
  hasAttachments?: boolean;
  isDraft?: boolean;
  body?: {
    contentType: string;
    content: string;
  };
  sender?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  from?: {
    emailAddress: OutlookEmailAddress;
  };
  toRecipients?: {
    emailAddress: OutlookEmailAddress;
  }[];
  ccRecipients?: {
    emailAddress: OutlookEmailAddress;
  }[];
  bccRecipients?: {
    emailAddress: OutlookEmailAddress;
  }[];
  // attachments?: OutlookAttachmentDataType[];
}

export interface CreateDraftResponseDataType {
  id: string;
  threadId: string;
}
