import {
  ID_INBOX,
  ID_SENT,
  ID_DRAFTS,
  ID_TRASH,
  ID_SPAM,
  ID_STARRED,
} from "../constants";
import { BidirectionalMap } from "../model/bidirectionalMap";

export const GMAIL_API_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

const gmailFolderIds = new BidirectionalMap<string, string>();
gmailFolderIds.add(ID_INBOX, "INBOX");
gmailFolderIds.add(ID_SENT, "SENT");
gmailFolderIds.add(ID_DRAFTS, "DRAFTS");
gmailFolderIds.add(ID_TRASH, "TRASH");
gmailFolderIds.add(ID_SPAM, "SPAM");
gmailFolderIds.add(ID_STARRED, "STARRED");

export const GMAIL_FOLDER_IDS_MAP = gmailFolderIds;
