// Helper functions for Outlook to follow Gmail nomenclature
import { OutlookMessageDataType } from "../model/users.thread";
import { db } from "../../lib/db";
import { get } from "./users/folder";
import { getAccessToken } from "../accessToken";

// Build headers for outlook messages for send functionality
export function buildMessageHeadersOutlook(message: OutlookMessageDataType) {
  // TODO: Add the rest of the headers later as needed
  return [
    {
      name: "From",
      value: message.from?.emailAddress?.address || "",
    },
    {
      name: "To",
      value: message.toRecipients[0]?.emailAddress.address || "",
    },
    {
      name: "Subject",
      value: message.subject,
    },
  ];
}

export function buildMessageLabelIdsOutlook(
  message: OutlookMessageDataType,
  folderId: string
) {
  const labelIds = [];

  if (!message.isRead) {
    labelIds.push("UNREAD");
  }

  if (message.flag && message.flag.flagStatus === "flagged") {
    labelIds.push("STARRED");
  }

  labelIds.push(folderId);
  return labelIds;
}

// Remove folders from labelIds, but allow for a list of labels to be preserved (e.g. UNREAD)
export function getLabelIdsForMoveMessageOutlook(
  labelIds: string[],
  folderId: string,
  allowList: string[] = []
) {
  console.log("Before:", labelIds);
  const filteredLabelIds = labelIds.filter((labelId) => {
    return allowList.includes(labelId);
  });

  filteredLabelIds.push(folderId);

  console.log("After:", filteredLabelIds);
  return filteredLabelIds;
}

export function addLabelIdsOutlook(labelIds: string[], label: string) {
  return labelIds.concat(label);
}

export function removeLabelIdsOutlook(labelIds: string[], label: string) {
  return labelIds.filter((labelId) => labelId !== label);
}

export function formatFolderDisplayNameOutlook(folderName: string) {
  return folderName.replace(/\s+/g, "");
}

export async function getFolderNameFromIdOutlook(
  email: string,
  folderId: string
) {
  const folderName = await db.outlookFolders.get(folderId);
  if (folderName) return folderName.displayName;

  const accessToken = await getAccessToken(email);
  const { data, error } = await get(accessToken, folderId);

  if (!data || error) {
    console.log("Error fetching folder name");
    return "";
  }

  const formattedDisplayName = formatFolderDisplayNameOutlook(data.displayName);
  await db.outlookFolders.put({
    id: folderId,
    displayName: formattedDisplayName,
  });

  return formattedDisplayName;
}
