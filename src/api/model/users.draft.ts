// import { OutlookAttachmentDataType } from "./users.attachment";
import { OutlookEmailAddress } from "./users.message";

export enum DraftStatusType {
  OPEN = "OPEN",
  SENT = "SENT",
  DISCARDED = "DISCARDED",
}

export enum DraftReplyType {
  STANDALONE = "STANDALONE",
  REPLY = "REPLY",
  REPLYALL = "REPLYALL",
  FORWARD = "FORWARD",
}

export enum DraftAccessType {
  VIEW = "VIEW",
  EDIT = "EDIT",
  OWNER = "OWNER",
}

export interface DraftParticipantType {
  email: string;
  accessLevel: DraftAccessType;
}

export interface GoogleDraftType {
  id: string;
  message?: {
    id: string;
    threadId: string;
  };
}

export interface GoogleDraftsListDataType {
  drafts: GoogleDraftType[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GoogleDraftsGetDataType {
  historyId: string;
  id: string;
  message: {
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
