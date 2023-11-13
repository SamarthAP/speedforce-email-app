import { FOLDER_IDS } from "../constants";
import { BidirectionalMap } from "../model/bidirectionalMap";

export const OUTLOOK_API_URL = "https://graph.microsoft.com/v1.0/me";

const outlookFolderIds = new BidirectionalMap<string, string>();
outlookFolderIds.add(FOLDER_IDS.INBOX, "Inbox");
outlookFolderIds.add(FOLDER_IDS.SENT, "SentItems");
outlookFolderIds.add(FOLDER_IDS.DRAFTS, "Drafts");
outlookFolderIds.add(FOLDER_IDS.TRASH, "DeletedItems");
outlookFolderIds.add(FOLDER_IDS.SPAM, "JunkEmail");
outlookFolderIds.add(FOLDER_IDS.DONE, "Archive");

export const OUTLOOK_FOLDER_IDS_MAP = outlookFolderIds;
