import { ID_INBOX, ID_SENT, ID_DRAFTS, ID_TRASH, ID_SPAM, ID_STARRED } from "../../api/constants";

export const GMAIL_API_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

export const getInboxName = (folderId: string) => {
  switch (folderId) {
    case ID_INBOX:
      return "INBOX";
    case ID_SENT:
      return "SENT";
    case ID_DRAFTS:
      return "DRAFT";
    case ID_TRASH:
      return "TRASH";
    case ID_SPAM:
      return "SPAM";
    case ID_STARRED:
      return "STARRED";
    default:
      return "INBOX";
  }
}