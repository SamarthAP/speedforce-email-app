import {
  ID_INBOX,
  ID_SENT,
  ID_DRAFTS,
  ID_TRASH,
  ID_SPAM,
  ID_STARRED,
  ID_DONE,
} from "../constants";
import { BidirectionalMap } from "../model/bidirectionalMap";

export const OUTLOOK_API_URL = "https://graph.microsoft.com/v1.0/me";

const outlookFolderIds = new BidirectionalMap<string, string>();
outlookFolderIds.add(ID_INBOX, "Inbox");
outlookFolderIds.add(ID_SENT, "SentItems");
outlookFolderIds.add(ID_DRAFTS, "Drafts");
outlookFolderIds.add(ID_TRASH, "DeletedItems");
outlookFolderIds.add(ID_SPAM, "JunkEmail");
outlookFolderIds.add(ID_DONE, "Archive");

export const OUTLOOK_FOLDER_IDS_MAP = outlookFolderIds;
