export interface OutlookEmailAddress {
  name: string;
  address: string;
}

export interface OutlookMessageDataType {
  id: string;
  subject: string;
  conversationId: string;
  sentDateTime: string;
  receivedDateTime: string;
  isRead: boolean;
  changeKey: string;
  categories: string[];
  hasAttachments: boolean;
  internetMessageId: string;
  importance: string;
  parentFolderId: string;
  isDraft: boolean;
  bodyPreview: string;
  body: {
    contentType: string;
    content: string;
  };
  flag: {
    flagStatus: string;
  };
  sender: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  from: {
    emailAddress: OutlookEmailAddress;
  };
  toRecipients: {
    emailAddress: OutlookEmailAddress;
  }[];
  ccRecipients: {
    emailAddress: OutlookEmailAddress;
  }[];
  bccRecipients: {
    emailAddress: OutlookEmailAddress;
  }[];
  replyTo: {
    emailAddress: OutlookEmailAddress;
  }[];
}
