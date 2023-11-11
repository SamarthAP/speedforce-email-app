import { FOLDER_IDS } from "../constants";
import { BidirectionalMap } from "../model/bidirectionalMap";

export const GMAIL_API_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

const gmailFolderIds = new BidirectionalMap<string, string>();
gmailFolderIds.add(FOLDER_IDS.INBOX, "INBOX");
gmailFolderIds.add(FOLDER_IDS.SENT, "SENT");
gmailFolderIds.add(FOLDER_IDS.DRAFTS, "DRAFT");
gmailFolderIds.add(FOLDER_IDS.TRASH, "TRASH");
gmailFolderIds.add(FOLDER_IDS.SPAM, "SPAM");
gmailFolderIds.add(FOLDER_IDS.STARRED, "STARRED");

export const GMAIL_FOLDER_IDS_MAP = gmailFolderIds;
