import { ID_INBOX, ID_SENT, ID_DRAFTS, ID_TRASH, ID_SPAM, ID_STARRED } from "../../api/constants";

export const OUTLOOK_API_URL = "https://graph.microsoft.com/v1.0/me";

export const getInboxName = (folderId: string) => {
  switch (folderId) {
    case ID_INBOX:
      return "Inbox";
    case ID_SENT:
      return "SentItems";
    case ID_DRAFTS:
      return "Drafts";
    case ID_TRASH:
      return "DeletedItems";
    case ID_SPAM:
      return "JunkEmail";
    // case ID_STARRED:
    //   return "Starred";
    default:
      return "Inbox";
  }
}